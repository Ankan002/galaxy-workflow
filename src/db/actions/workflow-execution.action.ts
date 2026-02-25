"use server";

import type {
	workflow_execution_type,
	node_execution_status,
	workflow_execution_status,
} from "@/db/prisma/client";
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
			status: "running" as workflow_execution_status,
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
			status: "running" as node_execution_status,
		},
	});
};

interface CreateSourceNodeExecutionArgs {
	workflowId: string;
	nodeId: string;
	workflowExecutionId: string;
	output: Record<string, unknown>;
}

/** Create a node execution already completed (for source nodes in full-flow: text, image_upload, video_upload). */
export const createSourceNodeExecution = async (
	args: CreateSourceNodeExecutionArgs,
) => {
	return prisma.node_execution.create({
		data: {
			workflow_id: args.workflowId,
			node_id: args.nodeId,
			workflow_execution_id: args.workflowExecutionId,
			status: "completed" as node_execution_status,
			output: args.output as object,
		},
	});
};

interface GetNodeOutputForExecutionArgs {
	workflowExecutionId: string;
	workflowId: string;
	nodeId: string;
}

/**
 * Returns the output of the given node in a specific workflow run, or null if not found/completed.
 * Used when resolving inputs during full-flow execution (same run).
 */
export const getNodeOutputForExecution = async (
	args: GetNodeOutputForExecutionArgs,
): Promise<Record<string, unknown> | null> => {
	const ne = await prisma.node_execution.findFirst({
		where: {
			workflow_execution_id: args.workflowExecutionId,
			workflow_id: args.workflowId,
			node_id: args.nodeId,
			status: "completed",
		},
		select: { output: true },
	});
	if (!ne?.output || typeof ne.output !== "object") return null;
	return ne.output as Record<string, unknown>;
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
			status: "completed",
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
	const hasError = args.error != null && args.error !== "";
	const data: {
		output?: object;
		error?: string | typeof Prisma.JsonNull;
		status: node_execution_status;
	} = {
		status: hasError ? "failed" : "completed",
	};
	if (args.output !== undefined) data.output = args.output as object;
	if (args.error !== undefined)
		data.error = hasError ? (args.error ?? Prisma.JsonNull) : Prisma.JsonNull;
	await prisma.node_execution.updateMany({
		where: {
			id: args.nodeExecutionId,
			workflow_id: args.workflowId,
		},
		data,
	});
};

interface GetWorkflowExecutionsArgs {
	workflowId: string;
	limit?: number;
	executionType?: "full" | "one_node";
}

export const getWorkflowExecutions = async (
	args: GetWorkflowExecutionsArgs,
) => {
	return prisma.workflow_execution.findMany({
		where: {
			workflow_id: args.workflowId,
			...(args.executionType && {
				execution_type: args.executionType,
			}),
		},
		orderBy: { created_at: "desc" },
		take: args.limit ?? 50,
		select: {
			id: true,
			workflow_id: true,
			execution_type: true,
			status: true,
			error: true,
			result: true,
			created_at: true,
			updated_at: true,
		},
	});
};

interface GetWorkflowExecutionWithNodeExecutionsArgs {
	workflowId: string;
	executionId: string;
}

export const getWorkflowExecutionWithNodeExecutions = async (
	args: GetWorkflowExecutionWithNodeExecutionsArgs,
) => {
	return prisma.workflow_execution.findFirst({
		where: {
			id: args.executionId,
			workflow_id: args.workflowId,
		},
		include: {
			node_executions: {
				orderBy: { created_at: "asc" },
				include: {
					node: {
						select: {
							id: true,
							type: true,
							config: true,
						},
					},
				},
			},
		},
	});
};

/** Get workflow execution meta (execution_type, status) by id. */
export const getWorkflowExecutionMeta = async (args: {
	workflowExecutionId: string;
	workflowId: string;
}) => {
	const we = await prisma.workflow_execution.findFirst({
		where: {
			id: args.workflowExecutionId,
			workflow_id: args.workflowId,
		},
		select: { execution_type: true, status: true },
	});
	return we;
};

/** Node IDs that already have a node_execution in this run (any status). Used to find "ready" nodes. */
export const getNodeIdsWithExecutionInRun = async (args: {
	workflowExecutionId: string;
	workflowId: string;
}): Promise<Set<string>> => {
	const list = await prisma.node_execution.findMany({
		where: {
			workflow_execution_id: args.workflowExecutionId,
			workflow_id: args.workflowId,
		},
		select: { node_id: true },
	});
	return new Set(list.map((r) => r.node_id));
};

/** Node IDs that have completed in this run. Used to find nodes whose inputs are now satisfied. */
export const getCompletedNodeIdsInRun = async (args: {
	workflowExecutionId: string;
	workflowId: string;
}): Promise<Set<string>> => {
	const list = await prisma.node_execution.findMany({
		where: {
			workflow_execution_id: args.workflowExecutionId,
			workflow_id: args.workflowId,
			status: "completed",
		},
		select: { node_id: true },
	});
	return new Set(list.map((r) => r.node_id));
};

/** Returns total, terminal (completed | failed) counts and whether any node failed. Used to mark workflow complete when all nodes are done. */
export const getWorkflowRunNodeExecutionCounts = async (args: {
	workflowExecutionId: string;
	workflowId: string;
}) => {
	const [total, terminal, failedCount] = await Promise.all([
		prisma.node_execution.count({
			where: {
				workflow_execution_id: args.workflowExecutionId,
				workflow_id: args.workflowId,
			},
		}),
		prisma.node_execution.count({
			where: {
				workflow_execution_id: args.workflowExecutionId,
				workflow_id: args.workflowId,
				status: { in: ["completed", "failed"] },
			},
		}),
		prisma.node_execution.count({
			where: {
				workflow_execution_id: args.workflowExecutionId,
				workflow_id: args.workflowId,
				status: "failed",
			},
		}),
	]);
	return { total, terminal, hasAnyFailed: failedCount > 0 };
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

interface UpdateWorkflowExecutionResultArgs {
	workflowExecutionId: string;
	workflowId: string;
	result?: Record<string, unknown> | null;
	error?: string | null;
}

/**
 * Write final result or error and status to workflow_execution (e.g. when a one_node run completes).
 */
export const updateWorkflowExecutionResult = async (
	args: UpdateWorkflowExecutionResultArgs,
) => {
	const hasError = args.error != null && args.error !== "";
	const data: {
		result?: object | typeof Prisma.JsonNull;
		error?: string | typeof Prisma.JsonNull;
		status: workflow_execution_status;
	} = {
		status: hasError ? "failed" : "completed",
	};
	if (args.result !== undefined)
		data.result = args.result != null ? (args.result as object) : Prisma.JsonNull;
	if (args.error !== undefined)
		data.error = hasError ? (args.error ?? Prisma.JsonNull) : Prisma.JsonNull;
	await prisma.workflow_execution.updateMany({
		where: {
			id: args.workflowExecutionId,
			workflow_id: args.workflowId,
		},
		data,
	});
};
