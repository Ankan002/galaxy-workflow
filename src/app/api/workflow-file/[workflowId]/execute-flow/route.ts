import { tasks } from "@trigger.dev/sdk";
import { serverUtilsRegistry } from "@/utils/server";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { createFullFlowRun } from "@/lib/execution/full-flow-execution";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

export const POST = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ user, params }) => {
		const workflowId = params?.workflowId;
		if (!workflowId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const { workflowExecutionId, nodeExecutionIds } = await createFullFlowRun(workflowId);
		await tasks.trigger("workflow-orchestrator", {
			workflowId,
			workflowExecutionId,
		});

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: {
				workflowExecutionId,
				nodeExecutionIds,
				message: "Full flow execution started",
			},
		});
	},
});
