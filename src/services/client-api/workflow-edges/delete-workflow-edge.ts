import { API_ROUTES } from "@/config/client-constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface DeleteWorkflowEdgeArgs {
	workflowId: string;
	edgeId: string;
}

export const deleteWorkflowEdge = async (
	args: DeleteWorkflowEdgeArgs,
): Promise<void> => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_EDGE.DELETE.dynamicPath(
			args.workflowId,
			args.edgeId,
		),
		{
			method: API_ROUTES.WORKFLOW_EDGE.DELETE.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to delete workflow edge: ${response.statusText}`,
		);
	}
};

export const useDeleteWorkflowEdge = (workflowId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (edgeId: string) =>
			deleteWorkflowEdge({ workflowId, edgeId }),
		mutationKey: [API_ROUTES.WORKFLOW_EDGE.DELETE.key, workflowId],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_EDGES.LIST.key, workflowId],
			});
		},
	});
};
