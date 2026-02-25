import { API_ROUTES } from "@/config/client-constants";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import type { Query } from "@tanstack/react-query";
import {
	keepPreviousData,
	QueryFunctionContext,
	useQuery,
} from "@tanstack/react-query";

export interface WorkflowExecutionListItem {
	id: string;
	workflow_id: string;
	execution_type: string;
	status: string;
	error: unknown;
	result: unknown;
	created_at: string;
	updated_at: string;
}

interface GetWorkflowExecutionsResponseData {
	executions: WorkflowExecutionListItem[];
}

interface GetWorkflowExecutionsArgs {
	workflowId: string;
	limit?: number;
	execution_type?: "full" | "one_node";
	/** Poll interval in ms, or function (use to avoid circular ref: read from query.state.data). */
	refetchInterval?: number | false | ((query: Query) => number | false | undefined);
}

const getWorkflowExecutions = async (
	args: QueryFunctionContext<[string, string, number?, string?]>,
) => {
	const { queryKey } = args;
	const [_, workflowId, limit, executionType] = queryKey;
	const params = new URLSearchParams();
	if (limit != null) params.set("limit", String(limit));
	if (executionType) params.set("execution_type", executionType);
	const url = `${API_ROUTES.WORKFLOW_EXECUTIONS.LIST.dynamicPath(workflowId as string)}?${params.toString()}`;
	const response = await fetch(url, {
		method: API_ROUTES.WORKFLOW_EXECUTIONS.LIST.method,
		headers: { "Content-Type": "application/json" },
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`Failed to get workflow executions: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GetWorkflowExecutionsResponseData>;

	if (!responseData.success) {
		throw new Error(
			`Failed to get workflow executions: ${responseData.error}`,
		);
	}

	if (!responseData.data) {
		throw new Error("Failed to get workflow executions!");
	}

	return responseData.data.executions;
};

export const useGetWorkflowExecutions = (args: GetWorkflowExecutionsArgs) => {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [
			API_ROUTES.WORKFLOW_EXECUTIONS.LIST.key,
			args.workflowId,
			args.limit ?? 50,
			args.execution_type,
		],
		queryFn: getWorkflowExecutions,
		enabled: isSignedIn && !!args.workflowId,
		placeholderData: keepPreviousData,
		refetchInterval: args.refetchInterval,
	});
};
