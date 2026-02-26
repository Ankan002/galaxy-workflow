import { task, batch, logger } from "@trigger.dev/sdk";
import { PrismaClient, Prisma } from "@/db/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { workflow_node_type } from "@/db/prisma/client";
import { cropImage } from "./crop-image";
import { runLLM } from "./run-llm";
import { extractVideoFrame } from "./extract-video-frame";

const TRIGGER_TASK_IDS: Record<
	Exclude<workflow_node_type, "text" | "image_upload" | "video_upload">,
	string
> = {
	run_llm: "run-llm",
	crop_image: "crop-image",
	extract_video_frame: "extract-video-frame",
};

const EXECUTABLE_NODE_TYPES = new Set<workflow_node_type>([
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

type NodeWithConfig = {
	id: string;
	type: string;
	config: Record<string, unknown> | null;
};

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

function getRequiredInputHandles(type: workflow_node_type): string[] {
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

function taskOutputToNodeOutput(
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

async function getReadyNodeIds(
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

interface ResolvedInputs {
	payload: Record<string, unknown>;
	missingInputs: { handle: string; message: string }[];
}

async function resolveInputsForNode(
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

export interface WorkflowOrchestratorPayload {
	workflowId: string;
	workflowExecutionId: string;
}

export const workflowOrchestrator = task({
	id: "workflow-orchestrator",
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 1000,
		maxTimeoutInMs: 30_000,
		randomize: true,
	},
	run: async (payload: WorkflowOrchestratorPayload) => {
		const { workflowId, workflowExecutionId } = payload;
		const connectionString = process.env["DATABASE_URL"];
		if (!connectionString) {
			throw new Error("DATABASE_URL is not set");
		}
		const prisma = new PrismaClient({
			adapter: new PrismaPg({ connectionString }),
		});

		const [nodes, edges] = await Promise.all([
			prisma.workflow_node.findMany({
				where: { workflow_id: workflowId },
				orderBy: { created_at: "asc" },
			}),
			prisma.workflow_edge.findMany({
				where: { workflow_id: workflowId },
				orderBy: { created_at: "asc" },
			}),
		]);

		if (nodes.length === 0) {
			logger.info("Orchestrator: workflow has no nodes", { workflowId, workflowExecutionId });
			return { done: true, waves: 0 };
		}

		const nodesById = new Map(
			nodes.map((n) => [
				n.id,
				{ id: n.id, type: n.type, config: (n.config as Record<string, unknown>) ?? {} },
			]),
		) as Map<string, NodeWithConfig>;
		const nodeIds = nodes.map((n) => n.id);
		const edgesSimple = edges.map((e) => ({
			source_node_id: e.source_node_id,
			target_node_id: e.target_node_id,
		}));
		const edgesWithHandles = edges.map((e) => ({
			source_node_id: e.source_node_id,
			target_node_id: e.target_node_id,
			source_handle: e.source_handle,
			target_handle: e.target_handle,
		}));

		let wave = 0;
		while (true) {
			// Respect user stop: if run was force-stopped via API, exit without triggering more waves.
			const we = await prisma.workflow_execution.findFirst({
				where: { id: workflowExecutionId, workflow_id: workflowId },
				select: { status: true },
			});
			if (!we || we.status !== "running") {
				logger.info("Orchestrator: run no longer running, exiting", {
					workflowId,
					workflowExecutionId,
					status: we?.status,
				});
				break;
			}

			const ready = await getReadyNodeIds(
				prisma,
				workflowId,
				workflowExecutionId,
				nodeIds,
				edgesSimple,
			);
			if (ready.length === 0) break;

			wave++;
			logger.info(`Orchestrator: wave ${wave}`, {
				workflowId,
				workflowExecutionId,
				readyNodeIds: ready,
			});

			const batchItems: { id: string; payload: Record<string, unknown> }[] = [];
			const nodeExecutionIds: string[] = [];
			const nodeTypes: workflow_node_type[] = [];

			for (const nodeId of ready) {
				const node = nodesById.get(nodeId)!;
				const nodeType = node.type as workflow_node_type;

				if (!EXECUTABLE_NODE_TYPES.has(nodeType)) {
					await prisma.node_execution.create({
						data: {
							workflow_id: workflowId,
							node_id: nodeId,
							workflow_execution_id: workflowExecutionId,
							status: "completed",
							output: {},
						},
					});
					continue;
				}

				const { payload: nodePayload, missingInputs } = await resolveInputsForNode(
					prisma,
					workflowId,
					workflowExecutionId,
					nodeId,
					node,
					nodesById,
					edgesWithHandles,
				);

				if (missingInputs.length > 0) {
					const ne = await prisma.node_execution.create({
						data: {
							workflow_id: workflowId,
							node_id: nodeId,
							workflow_execution_id: workflowExecutionId,
							status: "running",
						},
					});
					await prisma.node_execution.updateMany({
						where: { id: ne.id, workflow_id: workflowId },
						data: {
							status: "failed",
							error: missingInputs.map((m) => m.message).join(" "),
						},
					});
					continue;
				}

				const ne = await prisma.node_execution.create({
					data: {
						workflow_id: workflowId,
						node_id: nodeId,
						workflow_execution_id: workflowExecutionId,
						status: "running",
					},
				});

				const taskId = TRIGGER_TASK_IDS[nodeType as keyof typeof TRIGGER_TASK_IDS];
				const payloadWithMeta = {
					...nodePayload,
					_executionMeta: {
						workflowId,
						nodeId,
						nodeExecutionId: ne.id,
						workflowExecutionId,
						// no completionUrl – orchestrator will update DB from batch result
					},
				};
				batchItems.push({ id: taskId, payload: payloadWithMeta });
				nodeExecutionIds.push(ne.id);
				nodeTypes.push(nodeType);
			}

			if (batchItems.length === 0) continue;

			const results = await batch.triggerAndWait<typeof cropImage | typeof runLLM | typeof extractVideoFrame>(
				// Payloads are built per task id; cast to satisfy SDK union type.
				batchItems as unknown as Parameters<
					typeof batch.triggerAndWait<typeof cropImage | typeof runLLM | typeof extractVideoFrame>
				>[0],
			);

			// After waiting: if user stopped the run, exit without starting another wave.
			const weAfter = await prisma.workflow_execution.findFirst({
				where: { id: workflowExecutionId, workflow_id: workflowId },
				select: { status: true },
			});
			if (!weAfter || weAfter.status !== "running") {
				// Still write this wave's results so DB is consistent, then exit.
				for (let i = 0; i < results.runs.length; i++) {
					const run = results.runs[i];
					const nodeExecutionId = nodeExecutionIds[i];
					const nodeType = nodeTypes[i];
					const hasError = !run.ok;
					const output =
						run.ok && run.output != null
							? taskOutputToNodeOutput(nodeType, run.output as unknown as Record<string, unknown>)
							: null;
					const errorStr = hasError ? (run.error ?? "Unknown error") : null;
					const updateData = {
						status: (hasError ? "failed" : "completed") as "completed" | "failed",
						...(output != null && { output: output as object }),
						error: errorStr != null ? errorStr : Prisma.JsonNull,
					};
					await prisma.node_execution.updateMany({
						where: { id: nodeExecutionId, workflow_id: workflowId },
						data: updateData,
					});
				}
				logger.info("Orchestrator: run was stopped, exiting after writing wave results", {
					workflowId,
					workflowExecutionId,
				});
				break;
			}

			for (let i = 0; i < results.runs.length; i++) {
				const run = results.runs[i];
				const nodeExecutionId = nodeExecutionIds[i];
				const nodeType = nodeTypes[i];
				const hasError = !run.ok;
				const output =
					run.ok && run.output != null
						? taskOutputToNodeOutput(nodeType, run.output as unknown as Record<string, unknown>)
						: null;
				const errorStr = hasError ? (run.error ?? "Unknown error") : null;
				const updateData = {
					status: (hasError ? "failed" : "completed") as "completed" | "failed",
					...(output != null && { output: output as object }),
					error: errorStr != null ? errorStr : Prisma.JsonNull,
				};
				await prisma.node_execution.updateMany({
					where: { id: nodeExecutionId, workflow_id: workflowId },
					data: updateData,
				});
			}
		}

		const [total, terminal, failedCount] = await Promise.all([
			prisma.node_execution.count({
				where: {
					workflow_execution_id: workflowExecutionId,
					workflow_id: workflowId,
				},
			}),
			prisma.node_execution.count({
				where: {
					workflow_execution_id: workflowExecutionId,
					workflow_id: workflowId,
					status: { in: ["completed", "failed"] },
				},
			}),
			prisma.node_execution.count({
				where: {
					workflow_execution_id: workflowExecutionId,
					workflow_id: workflowId,
					status: "failed",
				},
			}),
		]);

		// Only update workflow_execution to completed/failed if still running (user may have stopped).
		const weFinal = await prisma.workflow_execution.findFirst({
			where: { id: workflowExecutionId, workflow_id: workflowId },
			select: { status: true },
		});

		if (weFinal?.status === "running" && total > 0 && total === terminal) {
			const nodeResults = await prisma.node_execution.findMany({
				where: {
					workflow_execution_id: workflowExecutionId,
					workflow_id: workflowId,
				},
				select: { node_id: true, status: true, output: true, error: true },
			});
			const nodesPayload: Record<string, unknown> = {};
			for (const ne of nodeResults) {
				const value: Record<string, unknown> = { status: ne.status };
				if (ne.output != null)
					value.output =
						typeof ne.output === "object" && ne.output !== null
							? (ne.output as Record<string, unknown>)
							: { value: ne.output };
				if (ne.error != null)
					value.error =
						typeof ne.error === "string"
							? ne.error
							: JSON.stringify(ne.error);
				nodesPayload[ne.node_id] = value;
			}
			const result = { nodes: nodesPayload } as Record<string, unknown>;
			await prisma.workflow_execution.updateMany({
				where: { id: workflowExecutionId, workflow_id: workflowId },
				data: {
					status: "completed",
					result: result as object,
					error: failedCount > 0 ? "One or more nodes failed" : Prisma.JsonNull,
				},
			});
		}

		logger.info("Orchestrator: finished", {
			workflowId,
			workflowExecutionId,
			waves: wave,
		});

		return { done: true, waves: wave };
	},
});
