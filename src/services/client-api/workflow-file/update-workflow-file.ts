import { API_ROUTES } from "@/config/client-constants";
import { workflow_file } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateWorkflowFileResponseData {
	workflow_file: workflow_file;
}

export interface UpdateWorkflowFileArgs {
	workflowId: string;
	name: string;
}

export const updateWorkflowFile = async (
	args: UpdateWorkflowFileArgs,
): Promise<workflow_file> => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_FILE.UPDATE.dynamicPath(args.workflowId),
		{
			method: API_ROUTES.WORKFLOW_FILE.UPDATE.method,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: args.name }),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to update workflow file: ${response.statusText}`,
		);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<UpdateWorkflowFileResponseData>;

	if (!responseData.success) {
		throw new Error(
			`Failed to update workflow file: ${responseData.error}`,
		);
	}

	if (!responseData.data) {
		throw new Error(`Failed to update workflow file!`);
	}

	return responseData.data.workflow_file;
};

export const useUpdateWorkflowFile = (workflowId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (name: string) =>
			updateWorkflowFile({ workflowId, name }),
		mutationKey: [API_ROUTES.WORKFLOW_FILE.UPDATE.key, workflowId],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_FILE.GET_ONE.key, workflowId],
			});
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_FILE.GET.key],
			});
		},
	});
};
