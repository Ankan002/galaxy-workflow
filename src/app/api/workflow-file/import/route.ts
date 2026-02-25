import { importWorkflowFromExport } from "@/db/actions/workflow-file.action";
import { workflowExportPayloadSchema } from "@/lib/workflow-export/schema";
import { serverUtilsRegistry } from "@/utils/server";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

interface ImportWorkflowResponseData {
	workflow_id: string;
	workflow_name: string;
}

/** POST /api/workflow-file/import — create a new workflow from exported JSON. */
export const POST = createApi<typeof workflowExportPayloadSchema, undefined, true>({
	requireAuth: true,
	bodySchema: workflowExportPayloadSchema,
	execute: async ({ body, user }) => {
		const payload = body!;
		const result = await importWorkflowFromExport(user!.id, payload);

		return sendJsonApiResponse<ImportWorkflowResponseData>({
			code: 200,
			success: true,
			data: {
				workflow_id: result.workflowId,
				workflow_name: result.workflowName,
			},
		});
	},
});
