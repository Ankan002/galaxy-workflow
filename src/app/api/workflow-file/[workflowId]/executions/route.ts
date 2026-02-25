import { getWorkflowExecutions } from "@/db/actions/workflow-execution.action";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { serverUtilsRegistry } from "@/utils/server";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

const querySchema = z.object({
	limit: z.coerce.number().min(1).max(100).optional().default(50),
	execution_type: z.enum(["full", "one_node"]).optional(),
});

export const GET = createApi<undefined, typeof querySchema, true>({
	requireAuth: true,
	querySchema,
	execute: async ({ user, params, query }) => {
		const workflowId = params?.workflowId;
		if (!workflowId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const executions = await getWorkflowExecutions({
			workflowId,
			limit: query?.limit,
			executionType: query?.execution_type,
		});

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: { executions },
		});
	},
});
