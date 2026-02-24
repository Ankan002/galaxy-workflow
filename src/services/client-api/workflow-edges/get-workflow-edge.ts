import { API_ROUTES } from "@/config/client-constants";
import { workflow_edge } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import { QueryFunctionContext, useQuery } from "@tanstack/react-query";

interface GetWorkflowEdgeResponseData {
	workflow_edge: workflow_edge | null;
}

const getWorkflowEdge = async (args: QueryFunctionContext) => {
	const { queryKey } = args;
	const [_, workflowId, edgeId] = queryKey;

	const response = await fetch(
		API_ROUTES.WORKFLOW_EDGE.GET.dynamicPath(
			workflowId as string,
			edgeId as string,
		),
		{
			method: API_ROUTES.WORKFLOW_EDGE.GET.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to get workflow edge: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GetWorkflowEdgeResponseData>;

	if (!responseData.success) {
		throw new Error(`Failed to get workflow edge: ${responseData.error}`);
	}

	if (!responseData.data) {
		throw new Error(`Failed to get workflow edge!`);
	}

	return responseData.data.workflow_edge;
};

interface HookArgs {
	workflowId: string;
	edgeId: string;
}

export const useGetWorkflowEdge = (args: HookArgs) => {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [
			API_ROUTES.WORKFLOW_EDGE.GET.key,
			args.workflowId,
			args.edgeId,
		],
		queryFn: getWorkflowEdge,
		enabled: isSignedIn && !!args.workflowId && !!args.edgeId,
	});
};
