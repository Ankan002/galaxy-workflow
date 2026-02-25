import {
	deleteWorkflowFile,
	updateWorkflowFileName,
} from "@/db/actions/workflow-file.action";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { serverUtilsRegistry } from "@/utils/server";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;
import z from "zod";

interface GetWorkflowFileResponseData {
	workflow_file: {
		id: string;
		name: string;
		type: string;
		created_at: Date;
		updated_at: Date;
	};
}

export const GET = createApi<undefined, undefined, true>({
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
		const workflow = await assertWorkflowOwnership(workflowId, user!.id);

		return sendJsonApiResponse<GetWorkflowFileResponseData>({
			code: 200,
			success: true,
			data: {
				workflow_file: {
					id: workflow.id,
					name: workflow.name,
					type: workflow.type,
					created_at: workflow.created_at,
					updated_at: workflow.updated_at,
				},
			},
		});
	},
});

const updateWorkflowFileBodySchema = z.object({
	name: z.string().trim().min(1),
});

interface UpdateWorkflowFileResponseData {
	workflow_file: {
		id: string;
		name: string;
		type: string;
		created_at: Date;
		updated_at: Date;
	};
}

export const PATCH = createApi<
	typeof updateWorkflowFileBodySchema,
	undefined,
	true
>({
	requireAuth: true,
	bodySchema: updateWorkflowFileBodySchema,
	execute: async ({ body, user, params }) => {
		const workflowId = params?.workflowId;
		if (!workflowId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const updated = await updateWorkflowFileName(workflowId, body!.name);

		return sendJsonApiResponse<UpdateWorkflowFileResponseData>({
			code: 200,
			success: true,
			data: {
				workflow_file: {
					id: updated.id,
					name: updated.name,
					type: updated.type,
					created_at: updated.created_at,
					updated_at: updated.updated_at,
				},
			},
		});
	},
});

export const DELETE = createApi<undefined, undefined, true>({
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
		await deleteWorkflowFile(workflowId);
		return sendJsonApiResponse({
			code: 200,
			success: true,
			message: "Deleted",
		});
	},
});
