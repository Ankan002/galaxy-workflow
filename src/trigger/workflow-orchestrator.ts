import { task, batch, logger } from "@trigger.dev/sdk";
import { PrismaClient, Prisma } from "@/db/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { workflow_node_type } from "@/db/prisma/client";
import { cropImage } from "./crop-image";
import { runLLM } from "./run-llm";
import { extractVideoFrame } from "./extract-video-frame";
import {
	TRIGGER_TASK_IDS,
	EXECUTABLE_NODE_TYPES,
	type NodeWithConfig,
	getReadyNodeIds,
	resolveInputsForNode,
	taskOutputToNodeOutput,
	buildExecutionMeta,
} from "./orchestrator-shared";

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

		// Stop check
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
			return { done: true, waves: 0 };
		}

		// Get initial ready nodes
		const ready = await getReadyNodeIds(
			prisma,
			workflowId,
			workflowExecutionId,
			nodeIds,
			edgesSimple,
		);

		if (ready.length === 0) {
			// No executable nodes ready (e.g. only sources) - check if all terminal
			const [total, terminal] = await Promise.all([
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
			]);
			if (total > 0 && total === terminal) {
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
							typeof ne.error === "string" ? ne.error : JSON.stringify(ne.error);
					nodesPayload[ne.node_id] = value;
				}
				const failedCount = nodeResults.filter((n) => n.status === "failed").length;
				await prisma.workflow_execution.updateMany({
					where: { id: workflowExecutionId, workflow_id: workflowId },
					data: {
						status: "completed",
						result: { nodes: nodesPayload } as object,
						error: failedCount > 0 ? "One or more nodes failed" : Prisma.JsonNull,
					},
				});
			}
			return { done: true, waves: 0 };
		}

		logger.info("Orchestrator: initial batch (topmost batch.triggerAndWait)", {
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
				_executionMeta: buildExecutionMeta(
					workflowId,
					nodeId,
					ne.id,
					workflowExecutionId,
				),
			};
			batchItems.push({ id: taskId, payload: payloadWithMeta });
			nodeExecutionIds.push(ne.id);
			nodeTypes.push(nodeType);
		}

		if (batchItems.length === 0) {
			return { done: true, waves: 0 };
		}

		// TOPMOST: batch.triggerAndWait for initial batch
		const results = await batch.triggerAndWait<
			typeof cropImage | typeof runLLM | typeof extractVideoFrame
		>(
			batchItems as unknown as Parameters<
				typeof batch.triggerAndWait<typeof cropImage | typeof runLLM | typeof extractVideoFrame>
			>[0],
		);

		// Update DB from batch results
		const weAfter = await prisma.workflow_execution.findFirst({
			where: { id: workflowExecutionId, workflow_id: workflowId },
			select: { status: true },
		});
		if (!weAfter || weAfter.status !== "running") {
			// Still write results for consistency
			for (let i = 0; i < results.runs.length; i++) {
				const run = results.runs[i];
				const neId = nodeExecutionIds[i];
				const nt = nodeTypes[i];
				const hasError = !run.ok;
				const output =
					run.ok && run.output != null
						? taskOutputToNodeOutput(nt, run.output as unknown as Record<string, unknown>)
						: null;
				const errorStr = hasError ? (run.error ?? "Unknown error") : null;
				await prisma.node_execution.updateMany({
					where: { id: neId, workflow_id: workflowId },
					data: {
						status: (hasError ? "failed" : "completed") as "completed" | "failed",
						...(output != null && { output: output as object }),
						error: errorStr != null ? errorStr : Prisma.JsonNull,
					},
				});
			}
			return { done: true, waves: 1 };
		}

		for (let i = 0; i < results.runs.length; i++) {
			const run = results.runs[i];
			const neId = nodeExecutionIds[i];
			const nt = nodeTypes[i];
			const hasError = !run.ok;
			const output =
				run.ok && run.output != null
					? taskOutputToNodeOutput(nt, run.output as unknown as Record<string, unknown>)
					: null;
			const errorStr = hasError ? (run.error ?? "Unknown error") : null;
			await prisma.node_execution.updateMany({
				where: { id: neId, workflow_id: workflowId },
				data: {
					status: (hasError ? "failed" : "completed") as "completed" | "failed",
					...(output != null && { output: output as object }),
					error: errorStr != null ? errorStr : Prisma.JsonNull,
				},
			});
		}

		// Children call tasks.trigger("process-node-completion") onComplete when they finish.
		// Orchestrator just updates DB from batch results; no need to trigger here.
		logger.info("Orchestrator: initial batch done", {
			workflowId,
			workflowExecutionId,
			count: results.runs.length,
		});

		return { done: true, waves: 1 };
	},
});
