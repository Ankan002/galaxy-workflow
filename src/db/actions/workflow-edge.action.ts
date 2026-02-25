"use server";

import { ApiError } from "@/types/errors/api-error";
import { prisma } from "../client";

/**
 * Kahn's algorithm: returns true if the graph (nodes + edges) is a DAG (no cycles).
 * Uses in-degree count and a queue of nodes with no incoming edges.
 */
function isDag(nodeIds: Set<string>, outgoing: Map<string, string[]>): boolean {
	const inDegree = new Map<string, number>();
	for (const id of nodeIds) {
		inDegree.set(id, 0);
	}
	for (const targets of outgoing.values()) {
		for (const t of targets) {
			inDegree.set(t, (inDegree.get(t) ?? 0) + 1);
		}
	}
	const queue: string[] = [];
	for (const [id, d] of inDegree) {
		if (d === 0) queue.push(id);
	}
	let processed = 0;
	while (queue.length > 0) {
		const u = queue.shift()!;
		processed++;
		for (const v of outgoing.get(u) ?? []) {
			const newD = (inDegree.get(v) ?? 1) - 1;
			inDegree.set(v, newD);
			if (newD === 0) queue.push(v);
		}
	}
	return processed === nodeIds.size;
}

interface CreateWorkflowEdgeArgs {
	workflowId: string;
	sourceNodeId: string;
	targetNodeId: string;
	sourceHandle: string;
	targetHandle: string;
}

/**
 * Creates a workflow edge only if it would not form a cycle (DAG invariant).
 * Uses Kahn's algorithm to check that the graph remains acyclic after adding the edge.
 */
export const createWorkflowEdge = async (args: CreateWorkflowEdgeArgs) => {
	const nodes = await prisma.workflow_node.findMany({
		where: { workflow_id: args.workflowId },
		select: { id: true },
	});
	const edges = await prisma.workflow_edge.findMany({
		where: { workflow_id: args.workflowId },
		select: { source_node_id: true, target_node_id: true },
	});

	const nodeIds = new Set(nodes.map((n) => n.id));
	if (!nodeIds.has(args.sourceNodeId) || !nodeIds.has(args.targetNodeId)) {
		throw new ApiError("Source or target node not found in workflow", 404);
	}

	const outgoing = new Map<string, string[]>();
	for (const id of nodeIds) {
		outgoing.set(id, []);
	}
	for (const e of edges) {
		outgoing.get(e.source_node_id)!.push(e.target_node_id);
	}
	// Add the new edge
	outgoing.get(args.sourceNodeId)!.push(args.targetNodeId);

	if (!isDag(nodeIds, outgoing)) {
		throw new ApiError(
			"Adding this edge would create a cycle. Workflow must remain a DAG.",
			400,
		);
	}

	const existing = await prisma.workflow_edge.findFirst({
		where: {
			workflow_id: args.workflowId,
			source_node_id: args.sourceNodeId,
			target_node_id: args.targetNodeId,
			source_handle: args.sourceHandle,
			target_handle: args.targetHandle,
		},
	});
	if (existing) {
		throw new ApiError("An edge with the same connection already exists", 409);
	}

	return prisma.workflow_edge.create({
		data: {
			workflow_id: args.workflowId,
			source_node_id: args.sourceNodeId,
			target_node_id: args.targetNodeId,
			source_handle: args.sourceHandle,
			target_handle: args.targetHandle,
		},
	});
};

interface GetWorkflowEdgesArgs {
	workflowId: string;
}

export const getWorkflowEdges = async (args: GetWorkflowEdgesArgs) => {
	return prisma.workflow_edge.findMany({
		where: {
			workflow_id: args.workflowId,
		},
		orderBy: {
			created_at: "asc",
		},
	});
};

interface GetWorkflowEdgeArgs {
	id: string;
	workflowId: string;
}

export const getWorkflowEdge = async (args: GetWorkflowEdgeArgs) => {
	return prisma.workflow_edge.findFirst({
		where: {
			id: args.id,
			workflow_id: args.workflowId,
		},
	});
};

interface DeleteWorkflowEdgeArgs {
	id: string;
	workflowId: string;
}

export const deleteWorkflowEdge = async (args: DeleteWorkflowEdgeArgs) => {
	const existing = await prisma.workflow_edge.findFirst({
		where: { id: args.id, workflow_id: args.workflowId },
	});
	if (!existing) return null;
	return prisma.workflow_edge.delete({
		where: { id: args.id },
	});
};

/**
 * Returns true if adding the given edge would keep the workflow a DAG.
 * Does not create the edge; use createWorkflowEdge to persist.
 */
export const wouldBeDagWithNewEdge = async (
	args: CreateWorkflowEdgeArgs,
): Promise<boolean> => {
	const nodes = await prisma.workflow_node.findMany({
		where: { workflow_id: args.workflowId },
		select: { id: true },
	});
	const edges = await prisma.workflow_edge.findMany({
		where: { workflow_id: args.workflowId },
		select: { source_node_id: true, target_node_id: true },
	});

	const nodeIds = new Set(nodes.map((n) => n.id));
	if (!nodeIds.has(args.sourceNodeId) || !nodeIds.has(args.targetNodeId)) {
		return false;
	}

	const outgoing = new Map<string, string[]>();
	for (const id of nodeIds) {
		outgoing.set(id, []);
	}
	for (const e of edges) {
		outgoing.get(e.source_node_id)!.push(e.target_node_id);
	}
	outgoing.get(args.sourceNodeId)!.push(args.targetNodeId);

	return isDag(nodeIds, outgoing);
};
