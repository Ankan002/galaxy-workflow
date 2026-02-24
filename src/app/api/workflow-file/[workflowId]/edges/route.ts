import {
	createWorkflowEdge,
	getWorkflowEdges,
} from "@/db/actions/workflow-edge.action";
import type { workflow_edge } from "@/db/prisma/client";
import {
	assertWorkflowOwnership,
	validateNodeConnection,
} from "@/utils/server/workflow-validators";
import { serverUtilsRegistry } from "@/utils/server";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;
import z from "zod";

const createEdgeBodySchema = z.object({
	sourceNodeId: z.string().min(1),
	targetNodeId: z.string().min(1),
	sourceHandle: z.string().min(1),
	targetHandle: z.string().min(1),
});

interface CreateEdgeResponseData {
	workflow_edge: workflow_edge;
}

export const POST = createApi<typeof createEdgeBodySchema, undefined, true>({
	requireAuth: true,
	bodySchema: createEdgeBodySchema,
	execute: async ({ body, user, params }) => {
		const workflowId = params?.workflowId;
		if (!workflowId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);
		await validateNodeConnection(
			body!.sourceNodeId,
			body!.targetNodeId,
			workflowId,
		);

		const edge = await createWorkflowEdge({
			workflowId,
			sourceNodeId: body!.sourceNodeId,
			targetNodeId: body!.targetNodeId,
			sourceHandle: body!.sourceHandle,
			targetHandle: body!.targetHandle,
		});

		return sendJsonApiResponse<CreateEdgeResponseData>({
			code: 200,
			success: true,
			data: { workflow_edge: edge },
		});
	},
});

interface GetEdgesResponseData {
	workflow_edges: workflow_edge[];
}

export const GET = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ user, params }) => {
		const workflowId = params?.workflowId;
		if (!workflowId) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: "Invalid workflow ID",
			});
		}
		await assertWorkflowOwnership(workflowId, user!.id);

		const edges = await getWorkflowEdges({ workflowId });

		return sendJsonApiResponse<GetEdgesResponseData>({
			code: 200,
			success: true,
			data: { workflow_edges: edges },
		});
	},
});
