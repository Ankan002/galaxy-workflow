import { API_ROUTES } from "@/config/client-constants";
import { workflow_edge } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import {
	keepPreviousData,
	QueryFunctionContext,
	useQuery,
} from "@tanstack/react-query";

interface GetWorkflowEdgesResponseData {
	workflow_edges: workflow_edge[];
}

const getWorkflowEdges = async (args: QueryFunctionContext) => {
	const { queryKey } = args;
	const [_, workflowId] = queryKey;

	const response = await fetch(
		API_ROUTES.WORKFLOW_EDGES.LIST.dynamicPath(workflowId as string),
		{
			method: API_ROUTES.WORKFLOW_EDGES.LIST.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to get workflow edges: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GetWorkflowEdgesResponseData>;

	if (!responseData.success) {
		throw new Error(`Failed to get workflow edges: ${responseData.error}`);
	}

	if (!responseData.data) {
		throw new Error(`Failed to get workflow edges!`);
	}

	return responseData.data.workflow_edges;
};

interface HookArgs {
	workflowId: string;
}

export const useGetWorkflowEdges = (args: HookArgs) => {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [API_ROUTES.WORKFLOW_EDGES.LIST.key, args.workflowId],
		queryFn: getWorkflowEdges,
		enabled: isSignedIn && !!args.workflowId,
		placeholderData: keepPreviousData,
	});
};
