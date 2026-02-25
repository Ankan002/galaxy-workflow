import type { workflow_node_provider, workflow_node_type } from "@/db/prisma/client";
import type { WorkflowExportPayload } from "@/lib/workflow-export/schema";
import { validateWorkflowImportPayload } from "@/lib/workflow-export/validate";
import { prisma } from "../client";
import { createWorkflowEdge } from "./workflow-edge.action";
import { createWorkflowNode } from "./workflow-node.action";

type CreateWorkflowFileArgs =
	| {
			clerkUserId: string;
			name: string;
			type: "user_created";
	  }
	| {
			type: "system_example";
			name: string;
	  };

export const createWorkflowFile = async (args: CreateWorkflowFileArgs) => {
	return prisma.workflow_file.create({
		data: {
			user:
				args.type === "user_created"
					? {
							connect: {
								clerk_id: args.clerkUserId,
							},
						}
					: undefined,
			name: args.name,
			type: args.type,
		},
	});
};

type GetWorkflowFileArgs =
	| {
			type: "user_created";
			search?: string;
			clerkUserId: string;
	  }
	| {
			type: "system_example";
			search?: string;
	  };

export const getWorkflowFiles = async (args: GetWorkflowFileArgs) => {
	return prisma.workflow_file.findMany({
		where: {
			type: args.type,
			user:
				args.type === "user_created"
					? {
							clerk_id: args.clerkUserId,
						}
					: undefined,
			name: {
				contains: args.search,
			},
		},
		orderBy: {
			created_at: "desc",
		},
	});
};

export const getWorkflowFileById = async (id: string) => {
	return prisma.workflow_file.findUnique({
		where: { id },
		include: { user: true },
	});
};

export const updateWorkflowFileName = async (id: string, name: string) => {
	return prisma.workflow_file.update({
		where: { id },
		data: { name },
	});
};

/** Result of importing a workflow from export JSON. */
export interface ImportWorkflowFromExportResult {
	workflowId: string;
	workflowName: string;
	nodeIdMap: Map<string, string>;
}

/**
 * Creates a new user_created workflow from an export payload (name, nodes, edges).
 * Always creates entirely new nodes (new DB ids); payload node ids are used only
 * to build the edge map (oldId -> newId) when creating edges.
 * Validates the payload, then creates the file, nodes, and edges.
 */
export const importWorkflowFromExport = async (
	clerkUserId: string,
	payload: WorkflowExportPayload,
): Promise<ImportWorkflowFromExportResult> => {
	validateWorkflowImportPayload(payload);

	const workflow = await createWorkflowFile({
		clerkUserId,
		name: payload.name,
		type: "user_created",
	});
	const workflowId = workflow.id;
	/** Maps exported node id -> new node id from DB. We never reuse payload ids. */
	const nodeIdMap = new Map<string, string>();

	for (const n of payload.nodes) {
		// Create a new node every time; DB assigns a new id. n.id is only for edge mapping.
		const node = await createWorkflowNode({
			workflowId,
			type: n.type as workflow_node_type,
			provider: n.provider as workflow_node_provider,
			positionX: n.position_x,
			positionY: n.position_y,
			config: n.config as Record<string, unknown>,
			metadata: n.metadata as Record<string, unknown> | undefined,
		});
		nodeIdMap.set(n.id, node.id);
	}

	for (const e of payload.edges) {
		const sourceId = nodeIdMap.get(e.source_node_id);
		const targetId = nodeIdMap.get(e.target_node_id);
		if (!sourceId || !targetId) continue;
		await createWorkflowEdge({
			workflowId,
			sourceNodeId: sourceId,
			targetNodeId: targetId,
			sourceHandle: e.source_handle,
			targetHandle: e.target_handle,
		});
	}

	return {
		workflowId,
		workflowName: workflow.name,
		nodeIdMap,
	};
};
