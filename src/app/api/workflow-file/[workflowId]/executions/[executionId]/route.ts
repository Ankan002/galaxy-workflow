import { getWorkflowExecutionWithNodeExecutions } from "@/db/actions/workflow-execution.action";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { serverUtilsRegistry } from "@/utils/server";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

interface GetExecutionResponseData {
	execution: Awaited<
		ReturnType<typeof getWorkflowExecutionWithNodeExecutions>
	>;
}

export const GET = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ user, params }) => {
		const workflowId = params?.workflowId;
		const executionId = params?.executionId;
		if (!workflowId || !executionId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID or execution ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const execution =
			await getWorkflowExecutionWithNodeExecutions({
				workflowId,
				executionId,
			});

		if (!execution) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Execution not found",
			});
		}

		return sendJsonApiResponse<GetExecutionResponseData>({
			code: 200,
			success: true,
			data: { execution },
		});
	},
});
