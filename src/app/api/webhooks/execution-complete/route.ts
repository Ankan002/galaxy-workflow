import { serverUtilsRegistry } from "@/utils/server";
import {
	updateNodeExecutionResult,
	getNodeExecutionById,
	getWorkflowExecutionMeta,
	getWorkflowRunNodeExecutionCounts,
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
				const { total, terminal, hasAnyFailed } = await getWorkflowRunNodeExecutionCounts({
					workflowExecutionId: executionId,
					workflowId,
				});
				if (total > 0 && total === terminal) {
					await updateWorkflowExecutionResult({
						workflowExecutionId: executionId,
						workflowId,
						error: hasAnyFailed ? "One or more nodes failed" : undefined,
					});
				}
			} else if (meta?.execution_type === "one_node") {
				// one_node (or unknown): single node run — mark workflow complete with this node's result/error
				await updateWorkflowExecutionResult({
					workflowExecutionId: executionId,
					workflowId,
					result:
						output && !error
							? (output as Record<string, unknown>)
							: undefined,
					error: error ?? undefined,
				});
			}
		}

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: { ok: true },
		});
	},
});
