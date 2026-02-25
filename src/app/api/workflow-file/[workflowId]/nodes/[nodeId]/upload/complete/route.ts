import { getWorkflowNode, updateWorkflowNode } from "@/db/actions/workflow-node.action";
import { serverUtilsRegistry } from "@/utils/server";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

const bodySchema = z.object({
	assembly_ssl_url: z.string().url(),
});

interface CompleteResponseData {
	previewUrl: string;
}

export const POST = createApi<typeof bodySchema, undefined, true>({
	requireAuth: true,
	bodySchema,
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

		const { tus } = serverUtilsRegistry;
		const previewUrl = await tus.fetchAssemblyAndGetPublicUrl(body!.assembly_ssl_url);

		const existing = await getWorkflowNode({ id: nodeId, workflowId });
		if (!existing) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Node not found",
			});
		}
		const currentConfig = (existing.config as Record<string, unknown>) ?? {};
		await updateWorkflowNode({
			id: nodeId,
			workflowId,
			config: { ...currentConfig, previewUrl },
		});

		return sendJsonApiResponse<CompleteResponseData>({
			code: 200,
			success: true,
			data: { previewUrl },
		});
	},
});
