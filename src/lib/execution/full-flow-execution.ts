import type { workflow_node_type } from "@/db/prisma/client";
import { Prisma } from "@/db/prisma/client";
import {
	createNodeExecution,
	createSourceNodeExecution,
	createWorkflowExecution,
	getNodeOutputForExecution,
	getNodeIdsWithExecutionInRun,
	getCompletedNodeIdsInRun,
	updateNodeExecutionResult,
} from "@/db/actions/workflow-execution.action";
import { getWorkflowEdges } from "@/db/actions/workflow-edge.action";
import { getWorkflowNodes } from "@/db/actions/workflow-node.action";
import { ApiError } from "@/types/errors/api-error";
import { getValidLlmModel } from "./llm-models";
import {
	EXECUTABLE_NODE_TYPES,
	extractTextFromPredecessorOutput,
	NON_EXECUTABLE_NODE_TYPES,
	type WorkflowNodeWithConfig,
} from "./single-node-execution";
import { tasks } from "@trigger.dev/sdk";

function isPrismaUniqueViolation(e: unknown): boolean {
	return (
		e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
	);
}

const TRIGGER_TASK_IDS: Record<
	Exclude<workflow_node_type, "text" | "image_upload" | "video_upload">,
	string
> = {
	run_llm: "run-llm",
	crop_image: "crop-image",
	extract_video_frame: "extract-video-frame",
};

function isSourceNodeType(type: workflow_node_type): boolean {
	return NON_EXECUTABLE_NODE_TYPES.has(type);
}

function getSourceNodeOutputRecord(node: WorkflowNodeWithConfig): Record<string, unknown> {
	const config = node.config ?? {};
	switch (node.type) {
		case "text":
			return { value: (config.value ?? config.text) ?? "" };
		case "image_upload":
			return { image: config.previewUrl ?? config.url };
		case "video_upload":
			return { url: config.previewUrl ?? config.url };
		default:
			return {};
	}
}

function topologicalOrder(
	nodeIds: string[],
	edges: { source_node_id: string; target_node_id: string }[],
): string[] {
	const outgoing = new Map<string, string[]>();
	for (const id of nodeIds) outgoing.set(id, []);
	for (const e of edges) outgoing.get(e.source_node_id)!.push(e.target_node_id);
	const inDegree = new Map<string, number>();
	for (const id of nodeIds) inDegree.set(id, 0);
	for (const targets of outgoing.values()) {
		for (const t of targets) inDegree.set(t, (inDegree.get(t) ?? 0) + 1);
	}
	const queue = nodeIds.filter((id) => inDegree.get(id) === 0);
	const order: string[] = [];
	while (queue.length > 0) {
		const u = queue.shift()!;
		order.push(u);
		for (const v of outgoing.get(u) ?? []) {
			const d = (inDegree.get(v) ?? 1) - 1;
			inDegree.set(v, d);
			if (d === 0) queue.push(v);
		}
	}
	return order;
}

/** Predecessor node_ids per target (only connected nodes). */
function getPredecessorsByNode(
	edges: { source_node_id: string; target_node_id: string }[],
): Map<string, Set<string>> {
	const map = new Map<string, Set<string>>();
	for (const e of edges) {
		if (!map.has(e.target_node_id)) map.set(e.target_node_id, new Set());
		map.get(e.target_node_id)!.add(e.source_node_id);
	}
	return map;
}

/** Node IDs that have all predecessors completed in this run and don't have an execution yet. Only considers connected nodes (targets of edges). */
async function getReadyNodeIds(
	workflowId: string,
	workflowExecutionId: string,
	nodeIds: string[],
	edges: { source_node_id: string; target_node_id: string }[],
): Promise<string[]> {
	const [hasExecution, completedNodeIds] = await Promise.all([
		getNodeIdsWithExecutionInRun({ workflowExecutionId, workflowId }),
		getCompletedNodeIdsInRun({ workflowExecutionId, workflowId }),
	]);
	const predecessorsByNode = getPredecessorsByNode(edges);
	const ready: string[] = [];
	for (const nodeId of nodeIds) {
		if (hasExecution.has(nodeId)) continue;
		const preds = predecessorsByNode.get(nodeId);
		if (!preds || preds.size === 0) continue; // no incoming edges = source node, already created
		const allPredsCompleted = [...preds].every((p) => completedNodeIds.has(p));
		if (allPredsCompleted) ready.push(nodeId);
	}
	return ready;
}

function getRequiredInputHandles(type: workflow_node_type): string[] {
	if (type === "crop_image") return ["image_url"];
	if (type === "extract_video_frame") return ["video_url"];
	return [];
}

const CROP_PERCENT_PAYLOAD_KEYS = ["x_percent", "y_percent", "width_percent", "height_percent"] as const;

function mapTargetHandleToPayloadKey(type: workflow_node_type, targetHandle: string): string | null {
	if (type === "crop_image") {
		if (targetHandle === "image_url") return "picture_url";
		if (CROP_PERCENT_PAYLOAD_KEYS.includes(targetHandle as (typeof CROP_PERCENT_PAYLOAD_KEYS)[number]))
			return targetHandle;
	}
	if (type === "extract_video_frame") {
		if (targetHandle === "video_url") return "video_url";
		if (targetHandle === "timestamp") return "timestamp";
	}
	if (type === "run_llm") {
		if (targetHandle === "systemPrompt") return "systemPrompt";
		if (targetHandle === "userMessages") return "prompt";
		if (targetHandle.startsWith("image_")) return "image_urls";
	}
	return null;
}

/** Returns a number in [0, 100] or null if value is not a valid percentage. */
function parsePercentage(value: unknown): number | null {
	if (value == null) return null;
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return null;
	return Math.min(100, Math.max(0, n));
}

function mergeNodeConfigIntoPayload(node: WorkflowNodeWithConfig, payload: Record<string, unknown>): void {
	const config = node.config ?? {};
	if (node.type === "crop_image") {
		const defaults = { x_percent: 0, y_percent: 0, width_percent: 100, height_percent: 100 };
		for (const key of CROP_PERCENT_PAYLOAD_KEYS) {
			if (payload[key] !== undefined && typeof payload[key] === "number") continue;
			const fromConfig = config[key];
			payload[key] =
				typeof fromConfig === "number" && fromConfig >= 0 && fromConfig <= 100
					? fromConfig
					: defaults[key];
		}
	}
	if (node.type === "extract_video_frame" && config.timestamp !== undefined) payload.timestamp = config.timestamp;
	if (node.type === "run_llm") {
		payload.model = getValidLlmModel(config.model);
		if (
			(payload.systemPrompt == null || payload.systemPrompt === "") &&
			config.systemPrompt != null
		)
			payload.systemPrompt = config.systemPrompt;
		if (config.temperature != null) payload.temperature = config.temperature;
		if (payload.prompt == null || payload.prompt === "") payload.prompt = (config.userMessages as string) ?? "";
	}
}

export interface ResolvedInputsForFlow {
	payload: Record<string, unknown>;
	missingInputs: { handle: string; message: string }[];
}

export async function resolveInputsForNodeInFlow(
	workflowId: string,
	workflowExecutionId: string,
	nodeId: string,
	nodesById: Map<string, WorkflowNodeWithConfig>,
	edges: { source_node_id: string; target_node_id: string; source_handle: string; target_handle: string }[],
): Promise<ResolvedInputsForFlow> {
	const node = nodesById.get(nodeId);
	if (!node) throw new ApiError("Node not found", 404);
	const incomingEdges = edges.filter((e) => e.target_node_id === nodeId);
	const requiredHandles = getRequiredInputHandles(node.type as workflow_node_type);
	const payload: Record<string, unknown> = {};
	const missingInputs: { handle: string; message: string }[] = [];
	const handleValues = new Map<string, unknown>();
	for (const edge of incomingEdges) {
		const targetHandle = edge.target_handle;
		const sourceNodeId = edge.source_node_id;
		const sourceHandle = edge.source_handle;
		const output = await getNodeOutputForExecution({
			workflowExecutionId,
			workflowId,
			nodeId: sourceNodeId,
		});
		const value = output ? (output[sourceHandle] as unknown) : undefined;
		if (value === undefined || value === null || value === "") {
			if (requiredHandles.includes(targetHandle)) {
				const sourceNode = nodesById.get(sourceNodeId);
				missingInputs.push({
					handle: targetHandle,
					message: `Missing input from ${sourceNode ? sourceNode.type : sourceNodeId}.`,
				});
			}
			continue;
		}
		handleValues.set(targetHandle, value);
	}
	const nodeType = node.type as workflow_node_type;
	for (const [targetHandle, value] of handleValues) {
		const payloadKey = mapTargetHandleToPayloadKey(nodeType, targetHandle);
		if (payloadKey === "image_urls") {
			const arr = (payload.image_urls as string[]) ?? [];
			arr.push(value as string);
			payload.image_urls = arr;
		} else if (payloadKey) {
			if (CROP_PERCENT_PAYLOAD_KEYS.includes(payloadKey as (typeof CROP_PERCENT_PAYLOAD_KEYS)[number])) {
				const pct = parsePercentage(value);
				if (pct !== null) payload[payloadKey] = pct;
				continue;
			}
			const resolved =
				payloadKey === "prompt" || payloadKey === "systemPrompt"
					? extractTextFromPredecessorOutput(value)
					: value;
			payload[payloadKey] = resolved;
		}
	}
	mergeNodeConfigIntoPayload(node, payload);
	if (nodeType === "run_llm" && (payload.prompt == null || String(payload.prompt).trim() === "")) {
		missingInputs.push({ handle: "userMessages", message: "Run LLM requires a prompt." });
	}
	return { payload, missingInputs };
}

/** Trigger all nodes that are ready (all predecessors completed in this run). Creates node executions and triggers tasks; marks failed if inputs missing. Call after source nodes are created and after each task completion in webhook. */
export async function triggerReadyNodes(
	workflowId: string,
	workflowExecutionId: string,
	completionUrl: string,
): Promise<void> {
	const [nodes, edges] = await Promise.all([
		getWorkflowNodes({ workflowId }),
		getWorkflowEdges({ workflowId }),
	]);
	if (nodes.length === 0) return;
	const nodesById = new Map(
		nodes.map((n) => [n.id, { ...n, config: (n.config as Record<string, unknown>) ?? {} } as WorkflowNodeWithConfig]),
	) as Map<string, WorkflowNodeWithConfig>;
	const nodeIds = nodes.map((n) => n.id);
	const ready = await getReadyNodeIds(
		workflowId,
		workflowExecutionId,
		nodeIds,
		edges.map((e) => ({ source_node_id: e.source_node_id, target_node_id: e.target_node_id })),
	);
	for (const nodeId of ready) {
		const node = nodesById.get(nodeId)!;
		const nodeType = node.type as workflow_node_type;
		if (!EXECUTABLE_NODE_TYPES.has(nodeType)) {
			try {
				await createSourceNodeExecution({
					workflowId,
					nodeId,
					workflowExecutionId,
					output: {},
				});
			} catch (e) {
				if (isPrismaUniqueViolation(e)) continue;
				throw e;
			}
			continue;
		}
		const { payload, missingInputs } = await resolveInputsForNodeInFlow(
			workflowId,
			workflowExecutionId,
			nodeId,
			nodesById,
			edges,
		);
		if (missingInputs.length > 0) {
			try {
				const ne = await createNodeExecution({
					workflowId,
					nodeId,
					workflowExecutionId,
				});
				await updateNodeExecutionResult({
					nodeExecutionId: ne.id,
					workflowId,
					error: missingInputs.map((m) => m.message).join(" "),
				});
			} catch (e) {
				if (isPrismaUniqueViolation(e)) continue;
				throw e;
			}
			continue;
		}
		try {
			const nodeExecution = await createNodeExecution({
				workflowId,
				nodeId,
				workflowExecutionId,
			});
			const taskId =
				TRIGGER_TASK_IDS[nodeType as keyof typeof TRIGGER_TASK_IDS];
			await tasks.trigger(taskId, {
				...payload,
				_executionMeta: {
					workflowId,
					nodeId,
					nodeExecutionId: nodeExecution.id,
					workflowExecutionId,
					completionUrl,
				},
			});
		} catch (e) {
			if (isPrismaUniqueViolation(e)) continue;
			throw e;
		}
	}
}

export interface ExecuteFullFlowResult {
	workflowExecutionId: string;
	nodeExecutionIds: string[];
	message: string;
}

/**
 * Creates a full-flow run (workflow_execution + source node_executions only).
 * Caller is responsible for either triggering the Trigger orchestrator or calling triggerReadyNodes (legacy).
 */
export async function createFullFlowRun(
	workflowId: string,
): Promise<{ workflowExecutionId: string; nodeExecutionIds: string[] }> {
	const [nodes, edges] = await Promise.all([
		getWorkflowNodes({ workflowId }),
		getWorkflowEdges({ workflowId }),
	]);
	if (nodes.length === 0) throw new ApiError("Workflow has no nodes", 400);
	const nodeIds = nodes.map((n) => n.id);
	const order = topologicalOrder(
		nodeIds,
		edges.map((e) => ({ source_node_id: e.source_node_id, target_node_id: e.target_node_id })),
	);
	if (order.length !== nodeIds.length) throw new ApiError("Workflow has a cycle", 400);
	const nodesById = new Map(
		nodes.map((n) => [n.id, { ...n, config: (n.config as Record<string, unknown>) ?? {} } as WorkflowNodeWithConfig]),
	) as Map<string, WorkflowNodeWithConfig>;
	const workflowExecution = await createWorkflowExecution({ workflowId, executionType: "full" });
	const nodeExecutionIds: string[] = [];
	for (const nodeId of order) {
		const node = nodesById.get(nodeId)!;
		const nodeType = node.type as workflow_node_type;
		if (isSourceNodeType(nodeType)) {
			const ne = await createSourceNodeExecution({
				workflowId,
				nodeId,
				workflowExecutionId: workflowExecution.id,
				output: getSourceNodeOutputRecord(node),
			});
			nodeExecutionIds.push(ne.id);
		}
	}
	return { workflowExecutionId: workflowExecution.id, nodeExecutionIds };
}

export async function executeFullFlow(
	workflowId: string,
	completionUrl: string,
): Promise<ExecuteFullFlowResult> {
	const { workflowExecutionId, nodeExecutionIds } = await createFullFlowRun(workflowId);
	await triggerReadyNodes(workflowId, workflowExecutionId, completionUrl);
	return {
		workflowExecutionId,
		nodeExecutionIds,
		message: "Full flow execution started",
	};
}
