import { API_ROUTES } from "@/config/client-constants";
import { workflow_node } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateWorkflowNodeResponseData {
	workflow_node: workflow_node | null;
}

export interface UpdateWorkflowNodeArgs {
	workflowId: string;
	nodeId: string;
	positionX?: number;
	positionY?: number;
	config?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export const updateWorkflowNode = async (
	args: UpdateWorkflowNodeArgs,
): Promise<workflow_node | null> => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_NODE.UPDATE.dynamicPath(
			args.workflowId,
			args.nodeId,
		),
		{
			method: API_ROUTES.WORKFLOW_NODE.UPDATE.method,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				positionX: args.positionX,
				positionY: args.positionY,
				config: args.config,
				metadata: args.metadata,
			}),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to update workflow node: ${response.statusText}`,
		);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<UpdateWorkflowNodeResponseData>;

	if (!responseData.success) {
		throw new Error(
			`Failed to update workflow node: ${responseData.error}`,
		);
	}

	if (!responseData.data) {
		throw new Error(`Failed to update workflow node!`);
	}

	return responseData.data.workflow_node;
};

export const useUpdateWorkflowNode = (workflowId: string, nodeId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (args: Omit<UpdateWorkflowNodeArgs, "workflowId" | "nodeId">) =>
			updateWorkflowNode({ ...args, workflowId, nodeId }),
		mutationKey: [API_ROUTES.WORKFLOW_NODE.UPDATE.key, workflowId, nodeId],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_NODES.LIST.key, workflowId],
			});
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_NODE.GET.key, workflowId, nodeId],
			});
		},
	});
};
