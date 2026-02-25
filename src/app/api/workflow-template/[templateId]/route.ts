import {
	deleteWorkflowTemplate,
	getWorkflowTemplateById,
	updateWorkflowTemplate,
} from "@/db/actions/workflow-template.action";
import type { workflow_template } from "@/db/prisma/client";
import { serverUtilsRegistry } from "@/utils/server";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

interface GetWorkflowTemplateResponseData {
	workflow_template: workflow_template | null;
}

export const GET = createApi<undefined, undefined, false>({
	requireAuth: false,
	execute: async ({ params }) => {
		const templateId = params?.templateId;
		if (!templateId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid template ID",
			});
		}
		const template = await getWorkflowTemplateById(templateId);
		return sendJsonApiResponse<GetWorkflowTemplateResponseData>({
			code: 200,
			success: true,
			data: { workflow_template: template },
		});
	},
});

const updateTemplateBodySchema = z.object({
	name: z.string().trim().min(1).max(500).optional(),
	json: z.record(z.string(), z.unknown()).optional(),
});

type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>;

interface UpdateWorkflowTemplateResponseData {
	workflow_template: workflow_template;
}

export const PATCH = createApi<UpdateTemplateBody, undefined, true>({
	requireAuth: true,
	bodySchema: updateTemplateBodySchema,
	execute: async ({ body, params }) => {
		const templateId = params?.templateId;
		if (!templateId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid template ID",
			});
		}
		const existing = await getWorkflowTemplateById(templateId);
		if (!existing) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Template not found",
			});
		}
		const template = await updateWorkflowTemplate({
			id: templateId,
			name: body?.name,
			json: body?.json,
		});
		return sendJsonApiResponse<UpdateWorkflowTemplateResponseData>({
			code: 200,
			success: true,
			data: { workflow_template: template },
		});
	},
});

export const DELETE = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ params }) => {
		const templateId = params?.templateId;
		if (!templateId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid template ID",
			});
		}
		const existing = await getWorkflowTemplateById(templateId);
		if (!existing) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Template not found",
			});
		}
		await deleteWorkflowTemplate(templateId);
		return sendJsonApiResponse({
			code: 200,
			success: true,
			message: "Deleted",
		});
	},
});
