"use server";

import type { workflow_execution_type } from "@/db/prisma/client";
import { prisma } from "../client";
import { Prisma } from "@/db/prisma/client";

interface CreateWorkflowExecutionArgs {
	workflowId: string;
	executionType: workflow_execution_type;
}

export const createWorkflowExecution = async (
	args: CreateWorkflowExecutionArgs,
) => {
	return prisma.workflow_execution.create({
		data: {
			workflow_id: args.workflowId,
			execution_type: args.executionType,
		},
	});
};

interface CreateNodeExecutionArgs {
	workflowId: string;
	nodeId: string;
	workflowExecutionId: string;
}

export const createNodeExecution = async (args: CreateNodeExecutionArgs) => {
	return prisma.node_execution.create({
		data: {
			workflow_id: args.workflowId,
			node_id: args.nodeId,
			workflow_execution_id: args.workflowExecutionId,
		},
	});
};

interface GetLatestNodeOutputArgs {
	workflowId: string;
	nodeId: string;
}

/**
 * Returns the output of the most recent successful execution for the given node,
 * or null if none. Used to resolve predecessor outputs when executing a downstream node.
 */
export const getLatestNodeOutput = async (
	args: GetLatestNodeOutputArgs,
): Promise<Record<string, unknown> | null> => {
	const latest = await prisma.node_execution.findFirst({
		where: {
			workflow_id: args.workflowId,
			node_id: args.nodeId,
			error: { equals: Prisma.DbNull },
			output: { not: Prisma.DbNull },
		},
		orderBy: { created_at: "desc" },
		select: { output: true },
	});
	if (!latest?.output || typeof latest.output !== "object") return null;
	return latest.output as Record<string, unknown>;
};

interface UpdateNodeExecutionResultArgs {
	nodeExecutionId: string;
	workflowId: string;
	output?: Record<string, unknown> | null;
	error?: string | null;
}

export const updateNodeExecutionResult = async (
	args: UpdateNodeExecutionResultArgs,
) => {
	const data: { output?: object; error?: string | typeof Prisma.JsonNull } = {};
	if (args.output !== undefined) data.output = args.output as object;
	if (args.error !== undefined)
		data.error =
			args.error != null && args.error !== "" ? args.error : Prisma.JsonNull;
	await prisma.node_execution.updateMany({
		where: {
			id: args.nodeExecutionId,
			workflow_id: args.workflowId,
		},
		data,
	});
};

interface GetNodeExecutionByIdArgs {
	id: string;
	workflowId: string;
}

export const getNodeExecutionById = async (
	args: GetNodeExecutionByIdArgs,
) => {
	return prisma.node_execution.findFirst({
		where: {
			id: args.id,
			workflow_id: args.workflowId,
		},
	});
};
