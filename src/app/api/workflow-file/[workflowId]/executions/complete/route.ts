import { serverUtilsRegistry } from "@/utils/server";
import { serverEnv } from "@/config/server-env";
import { updateNodeExecutionResult, getNodeExecutionById } from "@/db/actions/workflow-execution.action";
import { getWorkflowNode } from "@/db/actions/workflow-node.action";
import { taskOutputToNodeOutput } from "@/lib/execution/single-node-execution";
import type { workflow_node_type } from "@/db/prisma/client";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

const bodySchema = z.object({
	nodeExecutionId: z.string(),
	workflowId: z.string(),
	output: z.record(z.string(), z.unknown()).optional().nullable(),
	error: z.string().optional().nullable(),
});

/**
 * Called by Trigger.dev tasks when a single-node execution completes.
 * Verifies Authorization: Bearer TRIGGER_SECRET_KEY (set in Trigger env).
 */
export const POST = createApi<typeof bodySchema, undefined, false>({
	requireAuth: false,
	bodySchema,
	execute: async ({ body, req }) => {
		const authHeader = req.headers.get("authorization");
		const bearer = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;
		if (bearer !== serverEnv.TRIGGER_SECRET_KEY) {
			return sendJsonApiResponse({
				success: false,
				code: 401,
				error: "Unauthorized",
			});
		}

		if (!body?.nodeExecutionId || !body?.workflowId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "nodeExecutionId and workflowId are required",
			});
		}
		const { nodeExecutionId, workflowId, output, error } = body;

		const existing = await getNodeExecutionById({ id: nodeExecutionId, workflowId });
		if (!existing) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Node execution not found",
			});
		}

		const node = await getWorkflowNode({
			id: existing.node_id,
			workflowId,
		});
		const nodeType = (node?.type ?? "run_llm") as workflow_node_type;
		const outputToStore =
			output && !error
				? taskOutputToNodeOutput(nodeType, output as Record<string, unknown>)
				: undefined;

		await updateNodeExecutionResult({
			nodeExecutionId,
			workflowId,
			output: outputToStore ?? undefined,
			error: error ?? undefined,
		});

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: { ok: true },
		});
	},
});
