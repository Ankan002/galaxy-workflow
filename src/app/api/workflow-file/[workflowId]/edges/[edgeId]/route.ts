import {
	getWorkflowEdge,
	deleteWorkflowEdge,
} from "@/db/actions/workflow-edge.action";
import type { workflow_edge } from "@/db/prisma/client";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { createApi, sendJsonApiResponse } from "@/utils/server";

interface GetEdgeResponseData {
	workflow_edge: workflow_edge | null;
}

export const GET = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ user, params }) => {
		const workflowId = params?.workflowId;
		const edgeId = params?.edgeId;
		if (!workflowId || !edgeId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID or edge ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const edge = await getWorkflowEdge({
			id: edgeId,
			workflowId,
		});

		return sendJsonApiResponse<GetEdgeResponseData>({
			code: 200,
			success: true,
			data: { workflow_edge: edge },
		});
	},
});

export const DELETE = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ user, params }) => {
		const workflowId = params?.workflowId;
		const edgeId = params?.edgeId;
		if (!workflowId || !edgeId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID or edge ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const deleted = await deleteWorkflowEdge({
			id: edgeId,
			workflowId,
		});

		if (!deleted) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Edge not found",
			});
		}

		return sendJsonApiResponse({
			code: 200,
			success: true,
			message: "Deleted",
		});
	},
});
