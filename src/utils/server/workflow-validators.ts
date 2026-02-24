import { VALID_NODE_CONNECTIONS_SET } from "@/config/server-constants";
import { getWorkflowFileById } from "@/db/actions/workflow-file.action";
import { getWorkflowNode } from "@/db/actions/workflow-node.action";
import { ApiError } from "@/types/errors/api-error";

/**
 * Asserts the workflow exists and the current user (by clerkId) owns it.
 * Throws ApiError 404 if workflow not found, 403 if not owned.
 * Use for user_created workflows; system_example workflows have no user.
 */
export async function assertWorkflowOwnership(
	workflowId: string,
	clerkUserId: string,
) {
	const workflow = await getWorkflowFileById(workflowId);
	if (!workflow) {
		throw new ApiError("Workflow not found", 404);
	}
	if (workflow.type === "user_created") {
		if (!workflow.user_id || !workflow.user) {
			throw new ApiError("Workflow not found", 404);
		}
		if (workflow.user.clerk_id !== clerkUserId) {
			throw new ApiError("Forbidden", 403);
		}
	}
	return workflow;
}

/**
 * Asserts that source and target nodes exist in the workflow and that the
 * connection between their types is allowed (VALID_NODE_CONNECTIONS).
 * Throws ApiError 404 if either node is missing, 400 if source equals target or connection is invalid.
 */
export async function validateNodeConnection(
	sourceNodeId: string,
	targetNodeId: string,
	workflowId: string,
): Promise<void> {
	if (sourceNodeId === targetNodeId) {
		throw new ApiError("Source and target node cannot be the same", 400);
	}

	const sourceNode = await getWorkflowNode({ id: sourceNodeId, workflowId });
	const targetNode = await getWorkflowNode({ id: targetNodeId, workflowId });

	if (!sourceNode || !targetNode) {
		throw new ApiError("Source or target node not found", 404);
	}

	const connection = `${sourceNode.type}-${targetNode.type}`;
	if (!VALID_NODE_CONNECTIONS_SET.has(connection)) {
		throw new ApiError(
			`Invalid connection: ${sourceNode.type} → ${targetNode.type} is not allowed`,
			400,
		);
	}
}
