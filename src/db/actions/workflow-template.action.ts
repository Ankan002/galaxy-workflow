import type { WorkflowExportPayload } from "@/lib/workflow-export/schema";
import { workflowExportPayloadSchema } from "@/lib/workflow-export/schema";
import { validateWorkflowImportPayload } from "@/lib/workflow-export/validate";
import { prisma } from "../client";

export interface CreateWorkflowTemplateArgs {
	name: string;
	json: unknown;
}

export const createWorkflowTemplate = async (
	args: CreateWorkflowTemplateArgs,
) => {
	const parsed = workflowExportPayloadSchema.parse(args.json);
	validateWorkflowImportPayload(parsed);
	return prisma.workflow_template.create({
		data: {
			name: args.name.trim(),
			json: parsed as object,
		},
	});
};

export interface GetWorkflowTemplatesArgs {
	search?: string;
}

export const getWorkflowTemplates = async (
	args: GetWorkflowTemplatesArgs = {},
) => {
	return prisma.workflow_template.findMany({
		where: args.search
			? { name: { contains: args.search, mode: "insensitive" } }
			: undefined,
		orderBy: { created_at: "desc" },
	});
};

export const getWorkflowTemplateById = async (id: string) => {
	return prisma.workflow_template.findUnique({
		where: { id },
	});
};

export interface UpdateWorkflowTemplateArgs {
	id: string;
	name?: string;
	json?: unknown;
}

export const updateWorkflowTemplate = async (
	args: UpdateWorkflowTemplateArgs,
) => {
	const data: { name?: string; json?: object } = {};
	if (args.name !== undefined) data.name = args.name.trim();
	if (args.json !== undefined) {
		const parsed = workflowExportPayloadSchema.parse(
			args.json,
		) as WorkflowExportPayload;
		validateWorkflowImportPayload(parsed);
		data.json = parsed as object;
	}
	return prisma.workflow_template.update({
		where: { id: args.id },
		data,
	});
};

export const deleteWorkflowTemplate = async (id: string) => {
	return prisma.workflow_template.delete({
		where: { id },
	});
};
