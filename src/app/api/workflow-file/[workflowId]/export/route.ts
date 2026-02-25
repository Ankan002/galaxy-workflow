import {
	getWorkflowFileById,
} from "@/db/actions/workflow-file.action";
import { getWorkflowEdges } from "@/db/actions/workflow-edge.action";
import { getWorkflowNodes } from "@/db/actions/workflow-node.action";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import { serverUtilsRegistry } from "@/utils/server";
import type { WorkflowExportPayload } from "@/lib/workflow-export/schema";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

/** GET /api/workflow-file/:workflowId/export — returns workflow as JSON for download/import elsewhere. */
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

		const [workflow, nodes, edges] = await Promise.all([
			getWorkflowFileById(workflowId),
			getWorkflowNodes({ workflowId }),
			getWorkflowEdges({ workflowId }),
		]);

		if (!workflow) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Workflow not found",
			});
		}

		const payload: WorkflowExportPayload = {
			version: 1,
			name: workflow.name,
			nodes: nodes.map((n) => ({
				id: n.id,
				type: n.type,
				provider: n.provider,
				position_x: n.position_x,
				position_y: n.position_y,
				config: (n.config as Record<string, unknown>) ?? {},
				metadata: (n.metadata as Record<string, unknown> | undefined) ?? {},
			})),
			edges: edges.map((e) => ({
				source_node_id: e.source_node_id,
				target_node_id: e.target_node_id,
				source_handle: e.source_handle,
				target_handle: e.target_handle,
			})),
		};

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: payload,
		});
	},
});
