import {
	createWorkflowNode,
	getWorkflowNodes,
} from "@/db/actions/workflow-node.action";
import type { workflow_node } from "@/db/prisma/client";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { serverUtilsRegistry } from "@/utils/server";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;
import z from "zod";

const workflowNodeTypeSchema = z.union([
	z.literal("text"),
	z.literal("image_upload"),
	z.literal("video_upload"),
	z.literal("run_llm"),
	z.literal("crop_image"),
	z.literal("extract_video_frame"),
]);
const workflowNodeProviderSchema = z.union([
	z.literal("internal"),
	z.literal("trigger"),
	z.literal("transloadit"),
]);

const createNodeBodySchema = z.object({
	type: workflowNodeTypeSchema,
	provider: workflowNodeProviderSchema,
	positionX: z.number(),
	positionY: z.number(),
	config: z.record(z.string(), z.unknown()).default({}),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

interface CreateNodeResponseData {
	workflow_node: workflow_node;
}

export const POST = createApi<typeof createNodeBodySchema, undefined, true>({
	requireAuth: true,
	bodySchema: createNodeBodySchema,
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

		const node = await createWorkflowNode({
			workflowId,
			type: body.type,
			provider: body.provider,
			positionX: body.positionX,
			positionY: body.positionY,
			config: body.config,
			metadata: body.metadata,
		});

		return sendJsonApiResponse<CreateNodeResponseData>({
			code: 200,
			success: true,
			data: {
				workflow_node: node,
			},
		});
	},
});

interface GetNodesResponseData {
	workflow_nodes: workflow_node[];
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

		const nodes = await getWorkflowNodes({ workflowId });

		return sendJsonApiResponse<GetNodesResponseData>({
			code: 200,
			success: true,
			data: {
				workflow_nodes: nodes,
			},
		});
	},
});
