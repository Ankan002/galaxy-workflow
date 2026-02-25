import { API_ROUTES } from "@/config/client-constants";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import {
	keepPreviousData,
	QueryFunctionContext,
	useQuery,
} from "@tanstack/react-query";

export interface NodeExecutionWithNode {
	id: string;
	workflow_id: string;
	node_id: string;
	workflow_execution_id: string;
	status: string;
	output: unknown;
	error: unknown;
	created_at: string;
	updated_at: string;
	node: {
		id: string;
		type: string;
		config: unknown;
	};
}

export interface WorkflowExecutionWithNodes {
	id: string;
	workflow_id: string;
	execution_type: string;
	status: string;
	error: unknown;
	result: unknown;
	created_at: string;
	updated_at: string;
	node_executions: NodeExecutionWithNode[];
}

interface GetWorkflowExecutionResponseData {
	execution: WorkflowExecutionWithNodes;
}

const getWorkflowExecution = async (
	args: QueryFunctionContext<[string, string, string]>,
) => {
	const { queryKey } = args;
	const [_, workflowId, executionId] = queryKey;

	const response = await fetch(
		API_ROUTES.WORKFLOW_EXECUTIONS.GET_ONE.dynamicPath(
			workflowId as string,
			executionId as string,
		),
		{
			method: API_ROUTES.WORKFLOW_EXECUTIONS.GET_ONE.method,
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to get workflow execution: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GetWorkflowExecutionResponseData>;

	if (!responseData.success) {
		throw new Error(
			`Failed to get workflow execution: ${responseData.error}`,
		);
	}

	if (!responseData.data) {
		throw new Error("Failed to get workflow execution!");
	}

	return responseData.data.execution;
};

interface HookArgs {
	workflowId: string;
	executionId: string | null;
}

export const useGetWorkflowExecution = (args: HookArgs) => {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [
			API_ROUTES.WORKFLOW_EXECUTIONS.GET_ONE.key,
			args.workflowId,
			args.executionId ?? "",
		],
		queryFn: getWorkflowExecution,
		enabled:
			isSignedIn &&
			!!args.workflowId &&
			!!args.executionId,
		placeholderData: keepPreviousData,
	});
};
