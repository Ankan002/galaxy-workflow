import {
	getWorkflowNode,
	updateWorkflowNode,
	deleteWorkflowNode,
} from "@/db/actions/workflow-node.action";
import type { workflow_node } from "@/db/prisma/client";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { createApi, sendJsonApiResponse } from "@/utils/server";
import z from "zod";

const updateNodeBodySchema = z.object({
	positionX: z.number().optional(),
	positionY: z.number().optional(),
	config: z.record(z.string(), z.unknown()).optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

interface GetNodeResponseData {
	workflow_node: workflow_node | null;
}

export const GET = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ user, params }) => {
		const workflowId = params?.workflowId;
		const nodeId = params?.nodeId;
		if (!workflowId || !nodeId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID or node ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const node = await getWorkflowNode({
			id: nodeId,
			workflowId,
		});

		return sendJsonApiResponse<GetNodeResponseData>({
			code: 200,
			success: true,
			data: {
				workflow_node: node,
			},
		});
	},
});

interface UpdateNodeResponseData {
	workflow_node: workflow_node | null;
}

export const PATCH = createApi<typeof updateNodeBodySchema, undefined, true>({
	requireAuth: true,
	bodySchema: updateNodeBodySchema,
	execute: async ({ body, user, params }) => {
		const workflowId = params?.workflowId;
		const nodeId = params?.nodeId;
		if (!workflowId || !nodeId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID or node ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const node = await updateWorkflowNode({
			id: nodeId,
			workflowId,
			positionX: body!.positionX,
			positionY: body!.positionY,
			config: body!.config,
			metadata: body!.metadata,
		});

		return sendJsonApiResponse<UpdateNodeResponseData>({
			code: 200,
			success: true,
			data: { workflow_node: node },
		});
	},
});

export const DELETE = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ user, params }) => {
		const workflowId = params?.workflowId;
		const nodeId = params?.nodeId;
		if (!workflowId || !nodeId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID or node ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const deleted = await deleteWorkflowNode({
			id: nodeId,
			workflowId,
		});

		if (!deleted) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Node not found",
			});
		}

		return sendJsonApiResponse({
			code: 200,
			success: true,
			message: "Deleted",
		});
	},
});
