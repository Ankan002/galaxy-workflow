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
	isPrismaUniqueViolation,
} from "./orchestrator-shared";

export interface ProcessNodeCompletionPayload {
	workflowId: string;
	workflowExecutionId: string;
	nodeExecutionId: string;
	nodeId: string;
	output: Record<string, unknown> | null;
	error: string | null;
}

export const processNodeCompletion = task({
	id: "process-node-completion",
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 1000,
		maxTimeoutInMs: 30_000,
		randomize: true,
	},
	run: async (payload: ProcessNodeCompletionPayload) => {
		const {
			workflowId,
			workflowExecutionId,
			nodeExecutionId,
			nodeId,
			output,
			error,
		} = payload;

		const connectionString = process.env["DATABASE_URL"];
		if (!connectionString) {
			throw new Error("DATABASE_URL is not set");
		}
		const prisma = new PrismaClient({
			adapter: new PrismaPg({ connectionString }),
		});

		// 1. Update the completing node's execution
		const nodeRecord = await prisma.workflow_node.findFirst({
			where: { id: nodeId, workflow_id: workflowId },
			select: { type: true },
		});
		const nodeType = (nodeRecord?.type ?? "run_llm") as workflow_node_type;
		const outputToStore =
			output && !error
				? taskOutputToNodeOutput(nodeType, output)
				: undefined;

		await prisma.node_execution.updateMany({
			where: {
				id: nodeExecutionId,
				workflow_id: workflowId,
				workflow_execution_id: workflowExecutionId,
			},
			data: {
				status: (error ? "failed" : "completed") as "completed" | "failed",
				...(outputToStore != null && { output: outputToStore as object }),
				error: error != null ? error : Prisma.JsonNull,
			},
		});

		// 2. Stop check
		const we = await prisma.workflow_execution.findFirst({
			where: { id: workflowExecutionId, workflow_id: workflowId },
			select: { status: true, execution_type: true },
		});
		if (!we || we.status !== "running") {
			logger.info("process-node-completion: run no longer running, exiting", {
				workflowId,
				workflowExecutionId,
				status: we?.status,
			});
			return { done: true, reason: "stopped" };
		}

		// one_node: just update workflow_execution and exit
		if (we.execution_type === "one_node") {
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
					error: error ? error : Prisma.JsonNull,
				},
			});
			return { done: true, reason: "one_node" };
		}

		// On failure: do not continue with downstream tasks related to this node.
		// Still check if all nodes are terminal and mark workflow complete.
		if (error) {
			logger.info("process-node-completion: node failed, not triggering downstream", {
				workflowId,
				workflowExecutionId,
				nodeId,
			});
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
			const weCheck = await prisma.workflow_execution.findFirst({
				where: { id: workflowExecutionId, workflow_id: workflowId },
				select: { status: true },
			});
			if (
				weCheck?.status === "running" &&
				total > 0 &&
				total === terminal
			) {
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
				await prisma.workflow_execution.updateMany({
					where: { id: workflowExecutionId, workflow_id: workflowId },
					data: {
						status: "completed",
						result: { nodes: nodesPayload } as object,
						error: failedCount > 0 ? "One or more nodes failed" : Prisma.JsonNull,
					},
				});
			}
			return { done: true, reason: "node_failed" };
		}

		// 3. Load DAG
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

		// 4. Loop: get ready → batch.triggerAndWait → update → repeat
		let wave = 0;
		while (true) {
			const ready = await getReadyNodeIds(
				prisma,
				workflowId,
				workflowExecutionId,
				nodeIds,
				edgesSimple,
			);

			if (ready.length === 0) {
				// Check if all terminal, update workflow_execution
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

				const weCheck = await prisma.workflow_execution.findFirst({
					where: { id: workflowExecutionId, workflow_id: workflowId },
					select: { status: true },
				});

				if (
					weCheck?.status === "running" &&
					total > 0 &&
					total === terminal
				) {
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
					logger.info("process-node-completion: workflow completed", {
						workflowId,
						workflowExecutionId,
					});
				}
				break;
			}

			wave++;
			logger.info("process-node-completion: wave", {
				workflowId,
				workflowExecutionId,
				wave,
				readyNodeIds: ready,
			});

			const batchItems: { id: string; payload: Record<string, unknown> }[] = [];
			const nodeExecutionIds: string[] = [];
			const nodeTypes: workflow_node_type[] = [];

			for (const nodeId of ready) {
				const node = nodesById.get(nodeId)!;
				const nodeType = node.type as workflow_node_type;

				if (!EXECUTABLE_NODE_TYPES.has(nodeType)) {
					try {
						await prisma.node_execution.create({
							data: {
								workflow_id: workflowId,
								node_id: nodeId,
								workflow_execution_id: workflowExecutionId,
								status: "completed",
								output: {},
							},
						});
					} catch (e) {
						if (isPrismaUniqueViolation(e)) continue;
						throw e;
					}
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
					try {
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
					} catch (e) {
						if (isPrismaUniqueViolation(e)) continue;
						throw e;
					}
					continue;
				}

				try {
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
				} catch (e) {
					if (isPrismaUniqueViolation(e)) continue;
					throw e;
				}
			}

			if (batchItems.length === 0) continue;

			// Stop check before batch
			const weBefore = await prisma.workflow_execution.findFirst({
				where: { id: workflowExecutionId, workflow_id: workflowId },
				select: { status: true },
			});
			if (!weBefore || weBefore.status !== "running") {
				logger.info("process-node-completion: run stopped before batch", {
					workflowId,
					workflowExecutionId,
				});
				break;
			}

			const results = await batch.triggerAndWait<
				typeof cropImage | typeof runLLM | typeof extractVideoFrame
			>(
				batchItems as unknown as Parameters<
					typeof batch.triggerAndWait<typeof cropImage | typeof runLLM | typeof extractVideoFrame>
				>[0],
			);

			// Update from batch results
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
		}

		return { done: true, waves: wave };
	},
});
