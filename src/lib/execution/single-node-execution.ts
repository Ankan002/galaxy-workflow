import type { workflow_node_type } from "@/db/prisma/client";
import { getLatestNodeOutput } from "@/db/actions/workflow-execution.action";
import { getWorkflowEdges } from "@/db/actions/workflow-edge.action";
import { getWorkflowNode, getWorkflowNodes } from "@/db/actions/workflow-node.action";
import { ApiError } from "@/types/errors/api-error";

/** Node types that cannot be executed singly (source nodes). */
export const NON_EXECUTABLE_NODE_TYPES: Set<workflow_node_type> = new Set([
	"text",
	"image_upload",
	"video_upload",
]);

/** Node types that can be executed singly. */
export const EXECUTABLE_NODE_TYPES: Set<workflow_node_type> = new Set([
	"run_llm",
	"crop_image",
	"extract_video_frame",
]);

export type WorkflowNodeWithConfig = Awaited<
	ReturnType<typeof getWorkflowNode>
> & { config: Record<string, unknown> };

/**
 * Get the output value for a source node (text, image_upload, video_upload).
 * Returns the value that would be sent on the given output handle.
 */
function getSourceNodeOutput(
	node: WorkflowNodeWithConfig,
	sourceHandle: string,
): unknown {
	const config = node.config ?? {};
	switch (node.type) {
		case "text":
			return sourceHandle === "value" ? config.value : undefined;
		case "image_upload":
			return sourceHandle === "image" ? config.previewUrl : undefined;
		case "video_upload":
			return sourceHandle === "url" ? config.previewUrl : undefined;
		default:
			return undefined;
	}
}

function isSourceNodeType(type: workflow_node_type): boolean {
	return NON_EXECUTABLE_NODE_TYPES.has(type);
}

/**
 * Resolve the output value of a node for a given output handle.
 * For source nodes: read from config. For others: read from latest successful node_execution.
 */
export async function getNodeOutputForHandle(
	workflowId: string,
	nodeId: string,
	sourceHandle: string,
	nodesById: Map<string, WorkflowNodeWithConfig>,
): Promise<unknown> {
	const node = nodesById.get(nodeId);
	if (!node) return undefined;
	if (isSourceNodeType(node.type)) {
		return getSourceNodeOutput(node, sourceHandle);
	}
	const latest = await getLatestNodeOutput({ workflowId, nodeId });
	if (!latest) return undefined;
	return latest[sourceHandle];
}

export interface ResolvedInputs {
	payload: Record<string, unknown>;
	missingInputs: { handle: string; message: string }[];
}

/**
 * Resolve all inputs for the given node from its predecessors.
 * Returns the payload to send to the trigger task and any missing required inputs.
 */
export async function resolveInputsForNode(
	workflowId: string,
	nodeId: string,
): Promise<ResolvedInputs> {
	const [node, edges, allNodes] = await Promise.all([
		getWorkflowNode({ id: nodeId, workflowId }),
		getWorkflowEdges({ workflowId }),
		getWorkflowNodes({ workflowId }),
	]);

	if (!node) {
		throw new ApiError("Node not found", 404);
	}

	const nodesById = new Map(
		allNodes.map((n) => [
			n.id,
			{ ...n, config: (n.config as Record<string, unknown>) ?? {} } as WorkflowNodeWithConfig,
		]),
	) as Map<string, WorkflowNodeWithConfig>;

	const incomingEdges = edges.filter((e) => e.target_node_id === nodeId);
	const requiredHandles = getRequiredInputHandles(node.type);
	const payload: Record<string, unknown> = {};
	const missingInputs: { handle: string; message: string }[] = [];
	const handleValues = new Map<string, unknown>();

	for (const edge of incomingEdges) {
		const targetHandle = edge.target_handle;
		const sourceNodeId = edge.source_node_id;
		const sourceHandle = edge.source_handle;

		const value = await getNodeOutputForHandle(
			workflowId,
			sourceNodeId,
			sourceHandle,
			nodesById,
		);

		if (value === undefined || value === null || value === "") {
			if (requiredHandles.includes(targetHandle)) {
				const sourceNode = nodesById.get(sourceNodeId);
				const label = sourceNode
					? `Node "${sourceNode.id}" (${sourceNode.type})`
					: sourceNodeId;
				missingInputs.push({
					handle: targetHandle,
					message: `Missing required input "${targetHandle}" from predecessor ${label}. Ensure the predecessor has produced a value (e.g. upload a file or run the node).`,
				});
			}
			continue;
		}
		handleValues.set(targetHandle, value);
	}

	for (const [targetHandle, value] of handleValues) {
		const payloadKey = mapTargetHandleToPayloadKey(node.type, targetHandle);
		if (payloadKey === "image_urls") {
			const arr = (payload.image_urls as string[]) ?? [];
			arr.push(value as string);
			payload.image_urls = arr;
		} else if (payloadKey) {
			payload[payloadKey] = value;
		}
	}

	const nodeWithConfig =
		nodesById.get(nodeId) ??
		({ ...node, config: (node.config as Record<string, unknown>) ?? {} } as WorkflowNodeWithConfig);
	mergeNodeConfigIntoPayload(nodeWithConfig, payload);

	if (node.type === "run_llm") {
		const prompt = payload.prompt;
		if (prompt == null || String(prompt).trim() === "") {
			missingInputs.push({
				handle: "userMessages",
				message:
					"Run LLM requires a prompt. Connect a Text node or set a message in the node config.",
			});
		}
	}

	return { payload, missingInputs };
}

function getRequiredInputHandles(type: workflow_node_type): string[] {
	switch (type) {
		case "crop_image":
			return ["image_url"];
		case "extract_video_frame":
			return ["video_url"];
		case "run_llm":
			return []; // prompt can come from config or userMessages
		default:
			return [];
	}
}

function mapTargetHandleToPayloadKey(
	type: workflow_node_type,
	targetHandle: string,
): string | null {
	switch (type) {
		case "crop_image":
			return targetHandle === "image_url" ? "picture_url" : null;
		case "extract_video_frame":
			return targetHandle === "video_url"
				? "video_url"
				: targetHandle === "timestamp"
					? "timestamp"
					: null;
		case "run_llm":
			if (targetHandle === "systemPrompt") return "systemPrompt";
			if (targetHandle === "userMessages") return "prompt";
			if (targetHandle.startsWith("image_")) return "image_urls";
			return null;
		default:
			return null;
	}
}

function mergeNodeConfigIntoPayload(
	node: WorkflowNodeWithConfig,
	payload: Record<string, unknown>,
): void {
	const config = node.config ?? {};
	switch (node.type) {
		case "crop_image":
			if (payload.picture_url && typeof config.x_percent === "number")
				payload.x_percent = config.x_percent;
			if (typeof config.y_percent === "number") payload.y_percent = config.y_percent;
			if (typeof config.width_percent === "number")
				payload.width_percent = config.width_percent;
			if (typeof config.height_percent === "number")
				payload.height_percent = config.height_percent;
			break;
		case "extract_video_frame":
			if (config.timestamp !== undefined) payload.timestamp = config.timestamp;
			break;
		case "run_llm":
			if (config.model != null) payload.model = config.model;
			if (config.systemPrompt != null) payload.systemPrompt = config.systemPrompt;
			if (config.temperature != null) payload.temperature = config.temperature;
			if (payload.prompt == null || payload.prompt === "")
				payload.prompt = (config.userMessages as string) ?? "";
			break;
		default:
			break;
	}
}

/**
 * Normalize trigger task output to the shape we store in node_execution (keyed by output handle).
 */
export function taskOutputToNodeOutput(
	nodeType: workflow_node_type,
	taskOutput: Record<string, unknown>,
): Record<string, unknown> {
	switch (nodeType) {
		case "crop_image":
			return { image: taskOutput.uploaded_url };
		case "extract_video_frame":
			return { output: taskOutput.output };
		case "run_llm":
			return { response: taskOutput.text };
		default:
			return taskOutput;
	}
}
