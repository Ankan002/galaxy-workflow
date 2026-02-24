import { API_ROUTES } from "@/config/client-constants";
import { workflow_node } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import { QueryFunctionContext, useQuery } from "@tanstack/react-query";

interface GetWorkflowNodeResponseData {
	workflow_node: workflow_node | null;
}

const getWorkflowNode = async (args: QueryFunctionContext) => {
	const { queryKey } = args;
	const [_, workflowId, nodeId] = queryKey;

	const response = await fetch(
		API_ROUTES.WORKFLOW_NODE.GET.dynamicPath(
			workflowId as string,
			nodeId as string,
		),
		{
			method: API_ROUTES.WORKFLOW_NODE.GET.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to get workflow node: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GetWorkflowNodeResponseData>;

	if (!responseData.success) {
		throw new Error(`Failed to get workflow node: ${responseData.error}`);
	}

	if (!responseData.data) {
		throw new Error(`Failed to get workflow node!`);
	}

	return responseData.data.workflow_node;
};

interface HookArgs {
	workflowId: string;
	nodeId: string;
}

export const useGetWorkflowNode = (args: HookArgs) => {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [
			API_ROUTES.WORKFLOW_NODE.GET.key,
			args.workflowId,
			args.nodeId,
		],
		queryFn: getWorkflowNode,
		enabled: isSignedIn && !!args.workflowId && !!args.nodeId,
	});
};
