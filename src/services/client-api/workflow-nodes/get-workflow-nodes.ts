import { API_ROUTES } from "@/config/client-constants";
import { workflow_node } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import {
	keepPreviousData,
	QueryFunctionContext,
	useQuery,
} from "@tanstack/react-query";

interface GetWorkflowNodesResponseData {
	workflow_nodes: workflow_node[];
}

const getWorkflowNodes = async (args: QueryFunctionContext) => {
	const { queryKey } = args;
	const [_, workflowId] = queryKey;

	const response = await fetch(
		API_ROUTES.WORKFLOW_NODES.LIST.dynamicPath(workflowId as string),
		{
			method: API_ROUTES.WORKFLOW_NODES.LIST.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to get workflow nodes: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GetWorkflowNodesResponseData>;

	if (!responseData.success) {
		throw new Error(`Failed to get workflow nodes: ${responseData.error}`);
	}

	if (!responseData.data) {
		throw new Error(`Failed to get workflow nodes!`);
	}

	return responseData.data.workflow_nodes;
};

interface HookArgs {
	workflowId: string;
}

export const useGetWorkflowNodes = (args: HookArgs) => {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [API_ROUTES.WORKFLOW_NODES.LIST.key, args.workflowId],
		queryFn: getWorkflowNodes,
		enabled: isSignedIn && !!args.workflowId,
		placeholderData: keepPreviousData,
	});
};
