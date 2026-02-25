import { serverUtilsRegistry } from "@/utils/server";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { serverEnv } from "@/config/server-env";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

const bodySchema = z.object({
	type: z.enum(["image", "video"]),
});

interface PrepareResponseData {
	assembly_id: string;
	assembly_ssl_url: string;
	tus_url: string;
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

		const host = serverEnv.HOST.trim();
		const baseUrl = host.startsWith("http") ? host : `https://${host}`;
		const notifyUrl = `${baseUrl.replace(/\/$/, "")}/api/transloadit/notify?workflow_id=${encodeURIComponent(workflowId)}&node_id=${encodeURIComponent(nodeId)}`;

		const templateId =
			body.type === "video"
				? serverEnv.TRANSLOADIT_VIDEO_TEMPLATE_ID
				: serverEnv.TRANSLOADIT_IMAGE_TEMPLATE_ID;

		const { tus } = serverUtilsRegistry;
		const result = await tus.createAssemblyForClientUpload({
			templateId,
			notifyUrl,
			fields: { workflow_id: workflowId, node_id: nodeId },
		});

		return sendJsonApiResponse<PrepareResponseData>({
			code: 200,
			success: true,
			data: {
				assembly_id: result.assembly_id,
				assembly_ssl_url: result.assembly_ssl_url,
				tus_url: result.tus_url,
			},
		});
	},
});
