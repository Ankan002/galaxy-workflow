import { API_ROUTES } from "@/config/client-constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface DeleteWorkflowFileArgs {
	workflowId: string;
}

export const deleteWorkflowFile = async (
	args: DeleteWorkflowFileArgs,
): Promise<void> => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_FILE.DELETE.dynamicPath(args.workflowId),
		{
			method: API_ROUTES.WORKFLOW_FILE.DELETE.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to delete workflow file: ${response.statusText}`,
		);
	}
};

export const useDeleteWorkflowFile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (workflowId: string) =>
			deleteWorkflowFile({ workflowId }),
		mutationKey: [API_ROUTES.WORKFLOW_FILE.DELETE.key],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_FILE.GET.key],
			});
		},
	});
};
