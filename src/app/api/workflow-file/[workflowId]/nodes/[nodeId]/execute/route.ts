import { serverUtilsRegistry } from "@/utils/server";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";
import {
	EXECUTABLE_NODE_TYPES,
	NON_EXECUTABLE_NODE_TYPES,
	resolveInputsForNode,
} from "@/lib/execution/single-node-execution";
import {
	createNodeExecution,
	createWorkflowExecution,
} from "@/db/actions/workflow-execution.action";
import { getWorkflowNode } from "@/db/actions/workflow-node.action";
import { tasks } from "@trigger.dev/sdk";
import { serverEnv } from "@/config/server-env";
import type { workflow_node_type } from "@/db/prisma/client";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

const TRIGGER_TASK_IDS: Record<
	Exclude<workflow_node_type, "text" | "image_upload" | "video_upload">,
	string
> = {
	run_llm: "run-llm",
	crop_image: "crop-image",
	extract_video_frame: "extract-video-frame",
};

export const POST = createApi<undefined, undefined, true>({
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

		const node = await getWorkflowNode({ id: nodeId, workflowId });
		if (!node) {
			return sendJsonApiResponse({
				success: false,
				code: 404,
				error: "Node not found",
			});
		}

		const nodeType = node.type as workflow_node_type;
		if (NON_EXECUTABLE_NODE_TYPES.has(nodeType)) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: `Node type "${nodeType}" cannot be executed separately. Only processing nodes (e.g. Crop Image, Extract Video Frame, Run LLM) can be run.`,
			});
		}
		if (!EXECUTABLE_NODE_TYPES.has(nodeType)) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: `Node type "${nodeType}" is not supported for single-node execution.`,
			});
		}

		const { payload, missingInputs } = await resolveInputsForNode(
			workflowId,
			nodeId,
		);
		if (missingInputs.length > 0) {
			return sendJsonApiResponse({
				success: false,
				code: 400,
				error: missingInputs.map((m) => m.message).join(" "),
			});
		}

		const baseUrl = serverEnv.HOST.trim().startsWith("http")
			? serverEnv.HOST.trim()
			: `https://${serverEnv.HOST.trim()}`;
		const completionUrl = `${baseUrl.replace(/\/$/, "")}/api/workflow-file/${workflowId}/executions/complete`;

		const workflowExecution = await createWorkflowExecution({
			workflowId,
			executionType: "one_node",
		});
		const nodeExecution = await createNodeExecution({
			workflowId,
			nodeId,
			workflowExecutionId: workflowExecution.id,
		});

		const taskId = TRIGGER_TASK_IDS[nodeType];
		await tasks.trigger(taskId, {
			...payload,
			_executionMeta: {
				workflowId,
				nodeId,
				nodeExecutionId: nodeExecution.id,
				workflowExecutionId: workflowExecution.id,
				completionUrl,
			},
		});

		return sendJsonApiResponse({
			code: 200,
			success: true,
			data: {
				workflowExecutionId: workflowExecution.id,
				nodeExecutionId: nodeExecution.id,
				message: "Execution started",
			},
		});
	},
});
