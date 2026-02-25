import {
	getWorkflowEdge,
	deleteWorkflowEdge,
} from "@/db/actions/workflow-edge.action";
import type { workflow_edge } from "@/db/prisma/client";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { serverUtilsRegistry } from "@/utils/server";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

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

		await deleteWorkflowEdge({
			id: edgeId,
			workflowId,
		});

		// Idempotent: treat "already deleted" (e.g. by cascade) as success to avoid 404s
		return sendJsonApiResponse({
			code: 200,
			success: true,
			message: "Deleted",
		});
	},
});
