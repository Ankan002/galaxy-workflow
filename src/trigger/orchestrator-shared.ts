import type { PrismaClient } from "@/db/prisma/client";
import type { workflow_node_type } from "@/db/prisma/client";
import { Prisma } from "@/db/prisma/client";

export const TRIGGER_TASK_IDS: Record<
	Exclude<workflow_node_type, "text" | "image_upload" | "video_upload">,
	string
> = {
	run_llm: "run-llm",
	crop_image: "crop-image",
	extract_video_frame: "extract-video-frame",
};

export const EXECUTABLE_NODE_TYPES = new Set<workflow_node_type>([
	"run_llm",
	"crop_image",
	"extract_video_frame",
]);

const CROP_PERCENT_PAYLOAD_KEYS = [
	"x_percent",
	"y_percent",
	"width_percent",
	"height_percent",
] as const;

export type NodeWithConfig = {
	id: string;
	type: string;
	config: Record<string, unknown> | null;
};

export interface ExecutionMeta {
	workflowId: string;
	nodeId: string;
	nodeExecutionId: string;
	workflowExecutionId: string;
}

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

export function getRequiredInputHandles(type: workflow_node_type): string[] {
	if (type === "crop_image") return ["image_url"];
	if (type === "extract_video_frame") return ["video_url"];
	return [];
}

function mapTargetHandleToPayloadKey(
	type: workflow_node_type,
	targetHandle: string,
): string | null {
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

function parsePercentage(value: unknown): number | null {
	if (value == null) return null;
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return null;
	return Math.min(100, Math.max(0, n));
}

function extractTextFromPredecessorOutput(value: unknown): unknown {
	if (value == null) return value;
	if (typeof value === "string") return value;
	if (typeof value === "object" && value !== null) {
		const o = value as Record<string, unknown>;
		if (typeof o.response === "string") return o.response;
		if (typeof o.text === "string") return o.text;
	}
	return value;
}

const DEFAULT_LLM_MODEL = "gemini-2.5-flash";
const ALLOWED_LLM_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"] as const;

function getValidLlmModel(value: unknown): string {
	const s = typeof value === "string" ? value.trim() : "";
	return (ALLOWED_LLM_MODELS as readonly string[]).includes(s) ? s : DEFAULT_LLM_MODEL;
}

function mergeNodeConfigIntoPayload(
	node: NodeWithConfig,
	payload: Record<string, unknown>,
): void {
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
	if (node.type === "extract_video_frame" && config.timestamp !== undefined)
		payload.timestamp = config.timestamp;
	if (node.type === "run_llm") {
		payload.model = getValidLlmModel(config.model);
		if (
			(payload.systemPrompt == null || payload.systemPrompt === "") &&
			config.systemPrompt != null
		)
			payload.systemPrompt = config.systemPrompt;
		if (config.temperature != null) payload.temperature = config.temperature;
		if (payload.prompt == null || payload.prompt === "")
			payload.prompt = (config.userMessages as string) ?? "";
	}
}

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

export async function getReadyNodeIds(
	prisma: PrismaClient,
	workflowId: string,
	workflowExecutionId: string,
	nodeIds: string[],
	edges: { source_node_id: string; target_node_id: string }[],
): Promise<string[]> {
	const [executions, completed] = await Promise.all([
		prisma.node_execution.findMany({
			where: {
				workflow_execution_id: workflowExecutionId,
				workflow_id: workflowId,
			},
			select: { node_id: true },
		}),
		prisma.node_execution.findMany({
			where: {
				workflow_execution_id: workflowExecutionId,
				workflow_id: workflowId,
				status: "completed",
			},
			select: { node_id: true },
		}),
	]);
	const hasExecution = new Set(executions.map((r) => r.node_id));
	const completedNodeIds = new Set(completed.map((r) => r.node_id));
	const predecessorsByNode = getPredecessorsByNode(edges);
	const ready: string[] = [];
	for (const nodeId of nodeIds) {
		if (hasExecution.has(nodeId)) continue;
		const preds = predecessorsByNode.get(nodeId);
		if (!preds || preds.size === 0) continue;
		const allPredsCompleted = [...preds].every((p) => completedNodeIds.has(p));
		if (allPredsCompleted) ready.push(nodeId);
	}
	return ready;
}

async function getNodeOutputForRun(
	prisma: PrismaClient,
	workflowExecutionId: string,
	workflowId: string,
	nodeId: string,
): Promise<Record<string, unknown> | null> {
	const ne = await prisma.node_execution.findFirst({
		where: {
			workflow_execution_id: workflowExecutionId,
			workflow_id: workflowId,
			node_id: nodeId,
			status: "completed",
		},
		select: { output: true },
	});
	if (!ne?.output || typeof ne.output !== "object") return null;
	return ne.output as Record<string, unknown>;
}

export interface ResolvedInputs {
	payload: Record<string, unknown>;
	missingInputs: { handle: string; message: string }[];
}

export async function resolveInputsForNode(
	prisma: PrismaClient,
	workflowId: string,
	workflowExecutionId: string,
	nodeId: string,
	node: NodeWithConfig,
	nodesById: Map<string, NodeWithConfig>,
	edges: {
		source_node_id: string;
		target_node_id: string;
		source_handle: string;
		target_handle: string;
	}[],
): Promise<ResolvedInputs> {
	const incomingEdges = edges.filter((e) => e.target_node_id === nodeId);
	const requiredHandles = getRequiredInputHandles(node.type as workflow_node_type);
	const payload: Record<string, unknown> = {};
	const missingInputs: { handle: string; message: string }[] = [];
	const handleValues = new Map<string, unknown>();
	for (const edge of incomingEdges) {
		const targetHandle = edge.target_handle;
		const sourceNodeId = edge.source_node_id;
		const sourceHandle = edge.source_handle;
		const output = await getNodeOutputForRun(
			prisma,
			workflowExecutionId,
			workflowId,
			sourceNodeId,
		);
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
			if (
				CROP_PERCENT_PAYLOAD_KEYS.includes(payloadKey as (typeof CROP_PERCENT_PAYLOAD_KEYS)[number])
			) {
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
	if (
		nodeType === "run_llm" &&
		(payload.prompt == null || String(payload.prompt).trim() === "")
	) {
		missingInputs.push({ handle: "userMessages", message: "Run LLM requires a prompt." });
	}
	return { payload, missingInputs };
}

export function buildExecutionMeta(
	workflowId: string,
	nodeId: string,
	nodeExecutionId: string,
	workflowExecutionId: string,
): ExecutionMeta {
	return {
		workflowId,
		nodeId,
		nodeExecutionId,
		workflowExecutionId,
	};
}

export function isPrismaUniqueViolation(e: unknown): boolean {
	return (
		e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
	);
}
