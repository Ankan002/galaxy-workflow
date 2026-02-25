import { API_ROUTES } from "@/config/client-constants";
import { JsonApiResponse } from "@/types/api/json-api-response";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface StopWorkflowExecutionResponseData {
	stopped: boolean;
	executionId: string | null;
}

export const stopWorkflowExecution = async (
	workflowId: string,
	executionId?: string,
) => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_EXECUTIONS.STOP.dynamicPath(workflowId),
		{
			method: API_ROUTES.WORKFLOW_EXECUTIONS.STOP.method,
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(executionId != null ? { executionId } : {}),
		},
	);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `Stop failed: ${response.statusText}`);
	}

	const data = (await response.json()) as JsonApiResponse<StopWorkflowExecutionResponseData>;
	if (!data.success || !data.data) {
		throw new Error((data as { error?: string }).error ?? "Stop failed");
	}

	return data.data;
};

export const useStopWorkflowExecution = (workflowId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (executionId?: string) =>
			stopWorkflowExecution(workflowId, executionId),
		mutationKey: [API_ROUTES.WORKFLOW_EXECUTIONS.STOP.key, workflowId],
		onSuccess: (_data, executionId) => {
			// Optimistically mark the stopped execution so pulsating and editor state update immediately
			if (executionId != null) {
				queryClient.setQueriesData(
					{ queryKey: [API_ROUTES.WORKFLOW_EXECUTIONS.LIST.key, workflowId] },
					(old: { status: string; id: string }[] | undefined) =>
						old?.map((e) =>
							e.id === executionId ? { ...e, status: "failed" as const } : e,
						),
				);
			}
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_EXECUTIONS.LIST.key, workflowId],
			});
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_EXECUTIONS.GET_ONE.key, workflowId],
			});
		},
	});
};
