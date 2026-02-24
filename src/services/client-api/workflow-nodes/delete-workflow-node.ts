import { API_ROUTES } from "@/config/client-constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface DeleteWorkflowNodeArgs {
	workflowId: string;
	nodeId: string;
}

export const deleteWorkflowNode = async (
	args: DeleteWorkflowNodeArgs,
): Promise<void> => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_NODE.DELETE.dynamicPath(
			args.workflowId,
			args.nodeId,
		),
		{
			method: API_ROUTES.WORKFLOW_NODE.DELETE.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to delete workflow node: ${response.statusText}`,
		);
	}
};

export const useDeleteWorkflowNode = (workflowId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (nodeId: string) =>
			deleteWorkflowNode({ workflowId, nodeId }),
		mutationKey: [API_ROUTES.WORKFLOW_NODE.DELETE.key, workflowId],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_NODES.LIST.key, workflowId],
			});
		},
	});
};
