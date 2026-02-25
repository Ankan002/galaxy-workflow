import { serverUtilsRegistry } from "@/utils/server";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { executeFullFlow } from "@/lib/execution/full-flow-execution";
import { serverEnv } from "@/config/server-env";

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

		const baseUrl = serverEnv.HOST.trim().startsWith("http")
			? serverEnv.HOST.trim()
			: `https://${serverEnv.HOST.trim()}`;
		const completionUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/execution-complete`;

		const result = await executeFullFlow(workflowId, completionUrl);

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: result,
		});
	},
});
