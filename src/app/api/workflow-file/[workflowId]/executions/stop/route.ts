import { serverUtilsRegistry } from "@/utils/server";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { stopWorkflowExecution } from "@/db/actions/workflow-execution.action";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

const bodySchema = z.object({
	executionId: z.string().min(1).optional(),
});

export const POST = createApi<typeof bodySchema, undefined, true>({
	requireAuth: true,
	bodySchema,
	execute: async ({ user, params, body }) => {
		const workflowId = params?.workflowId;
		if (!workflowId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const result = await stopWorkflowExecution({
			workflowId,
			executionId: body?.executionId,
		});

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: {
				stopped: result !== null,
				executionId: result?.executionId ?? null,
			},
		});
	},
});
