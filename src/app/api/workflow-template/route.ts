import {
	createWorkflowTemplate,
	getWorkflowTemplates,
} from "@/db/actions/workflow-template.action";
import type { workflow_template } from "@/db/prisma/client";
import { serverUtilsRegistry } from "@/utils/server";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

const getTemplatesQuerySchema = z.object({
	search: z.string().trim().optional(),
});

type GetTemplatesQuery = typeof getTemplatesQuerySchema;

interface GetWorkflowTemplatesResponseData {
	workflow_templates: workflow_template[];
}

export const GET = createApi<undefined, GetTemplatesQuery, false>({
	requireAuth: false,
	querySchema: getTemplatesQuerySchema,
	execute: async ({ query }) => {
		const templates = await getWorkflowTemplates({
			search: query?.search,
		});
		return sendJsonApiResponse<GetWorkflowTemplatesResponseData>({
			code: 200,
			success: true,
			data: { workflow_templates: templates },
		});
	},
});

const createTemplateBodySchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(500),
	json: z.record(z.string(), z.unknown()),
});

type CreateTemplateBody = typeof createTemplateBodySchema;

interface CreateWorkflowTemplateResponseData {
	workflow_template: workflow_template;
}

export const POST = createApi<CreateTemplateBody, undefined, true>({
	requireAuth: true,
	bodySchema: createTemplateBodySchema,
	execute: async ({ body, user }) => {
		const template = await createWorkflowTemplate({
			name: body!.name,
			json: body!.json,
		});
		return sendJsonApiResponse<CreateWorkflowTemplateResponseData>({
			code: 200,
			success: true,
			data: { workflow_template: template },
		});
	},
});
