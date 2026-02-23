import {
	createWorkflowFile,
	getWorkflowFiles,
} from "@/db/actions/workflow-file.action";
import { workflow_file } from "@/db/prisma/client";
import { createApi, sendJsonApiResponse } from "@/utils/server";
import z from "zod";

const createWorkflowFileBodySchema = z.object({
	name: z
		.string({
			error: "Please provide a valid name",
		})
		.trim(),
});

type CreateWorkflowFileBody = typeof createWorkflowFileBodySchema;

interface CreateWorkflowFileresponsedata {
	workflow_file: workflow_file;
}

export const POST = createApi<CreateWorkflowFileBody, undefined, true>({
	requireAuth: true,
	bodySchema: createWorkflowFileBodySchema,
	execute: async ({ body, user }) => {
		const { name } = body;
		const { id } = user;

		const workflowFile = await createWorkflowFile({
			clerkUserId: id,
			name,
			type: "user_created",
		});

		return sendJsonApiResponse<CreateWorkflowFileresponsedata>({
			code: 200,
			success: true,
			data: {
				workflow_file: workflowFile,
			},
		});
	},
});

const getWorkflowFilesQuerySchema = z.object({
	query: z.string().trim().optional(),
});

type GetWorkflowFilesQuery = typeof getWorkflowFilesQuerySchema;

interface GetWorkflowFilesResponseData {
	workflow_files: workflow_file[];
}

export const GET = createApi<undefined, GetWorkflowFilesQuery, true>({
	requireAuth: true,
	querySchema: getWorkflowFilesQuerySchema,
	execute: async ({ query, user }) => {
		const { query: search } = query;
		const { id } = user;

		const workflowFiles = await getWorkflowFiles({
			type: "user_created",
			clerkUserId: id,
			search,
		});

		return sendJsonApiResponse<GetWorkflowFilesResponseData>({
			code: 200,
			success: true,
			data: {
				workflow_files: workflowFiles,
			},
		});
	},
});
