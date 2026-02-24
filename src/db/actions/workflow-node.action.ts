"use server";

import type { workflow_node_type, workflow_node_provider } from "@/db/prisma/client";
import { prisma } from "../client";

interface CreateWorkflowNodeArgs {
	workflowId: string;
	type: workflow_node_type;
	provider: workflow_node_provider;
	positionX: number;
	positionY: number;
	config: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export const createWorkflowNode = async (args: CreateWorkflowNodeArgs) => {
	return prisma.workflow_node.create({
		data: {
			workflow_id: args.workflowId,
			type: args.type,
			provider: args.provider,
			position_x: args.positionX,
			position_y: args.positionY,
			config: args.config as object,
			metadata: (args.metadata ?? {}) as object,
		},
	});
};

interface GetWorkflowNodesArgs {
	workflowId: string;
}

export const getWorkflowNodes = async (args: GetWorkflowNodesArgs) => {
	return prisma.workflow_node.findMany({
		where: {
			workflow_id: args.workflowId,
		},
		orderBy: {
			created_at: "asc",
		},
	});
};

interface GetWorkflowNodeArgs {
	id: string;
	workflowId: string;
}

export const getWorkflowNode = async (args: GetWorkflowNodeArgs) => {
	return prisma.workflow_node.findFirst({
		where: {
			id: args.id,
			workflow_id: args.workflowId,
		},
	});
};

interface UpdateWorkflowNodeArgs {
	id: string;
	workflowId: string;
	positionX?: number;
	positionY?: number;
	config?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export const updateWorkflowNode = async (args: UpdateWorkflowNodeArgs) => {
	const { id, workflowId, ...updates } = args;
	const existing = await prisma.workflow_node.findFirst({
		where: { id, workflow_id: workflowId },
	});
	if (!existing) return null;
	const data: Record<string, unknown> = {};
	if (updates.positionX !== undefined) data.position_x = updates.positionX;
	if (updates.positionY !== undefined) data.position_y = updates.positionY;
	if (updates.config !== undefined) data.config = updates.config;
	if (updates.metadata !== undefined) data.metadata = updates.metadata;

	return prisma.workflow_node.update({
		where: { id },
		data: data as object,
	});
};

interface DeleteWorkflowNodeArgs {
	id: string;
	workflowId: string;
}

export const deleteWorkflowNode = async (args: DeleteWorkflowNodeArgs) => {
	const existing = await prisma.workflow_node.findFirst({
		where: { id: args.id, workflow_id: args.workflowId },
	});
	if (!existing) return null;
	return prisma.workflow_node.delete({
		where: { id: args.id },
	});
};
