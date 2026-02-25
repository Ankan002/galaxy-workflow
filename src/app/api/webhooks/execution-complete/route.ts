import { serverUtilsRegistry } from "@/utils/server";
import {
	updateNodeExecutionResult,
	getNodeExecutionById,
	getWorkflowExecutionMeta,
	getWorkflowRunNodeExecutionCounts,
	getWorkflowRunNodeResults,
	updateWorkflowExecutionResult,
} from "@/db/actions/workflow-execution.action";
import { getWorkflowNode } from "@/db/actions/workflow-node.action";
import { taskOutputToNodeOutput } from "@/lib/execution/single-node-execution";
import { triggerReadyNodes } from "@/lib/execution/full-flow-execution";
import type { workflow_node_type } from "@/db/prisma/client";
import { EXECUTION_COMPLETE_HEADER_KEY } from "@/trigger/execution-callback";
import { serverEnv } from "@/config/server-env";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

const bodySchema = z.object({
	execution_id: z.string().optional(),
	execution_node_id: z.string(),
	node_id: z.string().optional(),
	workflow_id: z.string(),
	output: z.record(z.string(), z.unknown()).optional().nullable(),
	error: z.string().optional().nullable(),
});

/**
 * Webhook: receives execution completion from trigger tasks. Auth: x-complete-key header.
 */
export const POST = createApi<typeof bodySchema, undefined, false>({
	requireAuth: false,
	bodySchema,
	execute: async ({ body, req }) => {
		const key = req.headers.get("x-complete-key");
		if (key !== EXECUTION_COMPLETE_HEADER_KEY) {
			return sendJsonApiResponse({
				success: false,
				code: 401,
				error: "Unauthorized",
			});
		}

		const {
			execution_id: executionId,
			execution_node_id: executionNodeId,
			node_id: nodeId,
			workflow_id: workflowId,
			output,
			error,
		} = body!;

		const existing = await getNodeExecutionById({
			id: executionNodeId,
			workflowId,
		});
		if (!existing) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Node execution not found",
			});
		}

		const node = await getWorkflowNode({
			id: nodeId ?? existing.node_id,
			workflowId,
		});
		const nodeType = (node?.type ?? "run_llm") as workflow_node_type;
		const outputToStore =
			output && !error
				? taskOutputToNodeOutput(
						nodeType,
						output as Record<string, unknown>,
					)
				: undefined;

		await updateNodeExecutionResult({
			nodeExecutionId: executionNodeId,
			workflowId,
			output: outputToStore ?? undefined,
			error: error ?? undefined,
		});

		if (executionId) {
			const meta = await getWorkflowExecutionMeta({
				workflowExecutionId: executionId,
				workflowId,
			});
			if (meta?.execution_type === "full" && meta?.status === "running") {
				const baseUrl = serverEnv.HOST.trim().startsWith("http")
					? serverEnv.HOST.trim()
					: `https://${serverEnv.HOST.trim()}`;
				const completionUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/execution-complete`;
				await triggerReadyNodes(workflowId, executionId, completionUrl);
			}
			if (meta?.execution_type === "one_node") {
				// one_node: single node run — mark workflow complete with this node's result/error
				await updateWorkflowExecutionResult({
					workflowExecutionId: executionId,
					workflowId,
					result:
						output && !error
							? (output as Record<string, unknown>)
							: undefined,
					error: error ?? undefined,
				});
			} else if (meta?.execution_type === "full") {
				// full flow: when all nodes are terminal, set workflow result from node outputs
				const { total, terminal, hasAnyFailed } =
					await getWorkflowRunNodeExecutionCounts({
						workflowExecutionId: executionId,
						workflowId,
					});
				if (
					total > 0 &&
					total === terminal &&
					meta.status === "running"
				) {
					const nodeResults = await getWorkflowRunNodeResults({
						workflowExecutionId: executionId,
						workflowId,
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
					await updateWorkflowExecutionResult({
						workflowExecutionId: executionId,
						workflowId,
						result: JSON.parse(JSON.stringify(result)),
						error: hasAnyFailed ? "One or more nodes failed" : undefined,
					});
				}
			}
		}

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: { ok: true },
		});
	},
});
