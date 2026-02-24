import { API_ROUTES } from "@/config/client-constants";
import { workflow_file } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import {
	keepPreviousData,
	QueryFunctionContext,
	useQuery,
} from "@tanstack/react-query";

interface GetWorkflowFileResponseData {
	workflow_file: workflow_file;
}

const getWorkflowFile = async (args: QueryFunctionContext) => {
	const { queryKey } = args;
	const [_, workflowId] = queryKey;

	const response = await fetch(
		API_ROUTES.WORKFLOW_FILE.GET_ONE.dynamicPath(workflowId as string),
		{
			method: API_ROUTES.WORKFLOW_FILE.GET_ONE.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to get workflow file: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GetWorkflowFileResponseData>;

	if (!responseData.success) {
		throw new Error(`Failed to get workflow file: ${responseData.error}`);
	}

	if (!responseData.data) {
		throw new Error(`Failed to get workflow file!`);
	}

	return responseData.data.workflow_file;
};

interface HookArgs {
	workflowId: string;
}

export const useGetWorkflowFile = (args: HookArgs) => {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [API_ROUTES.WORKFLOW_FILE.GET_ONE.key, args.workflowId],
		queryFn: getWorkflowFile,
		enabled: isSignedIn && !!args.workflowId,
		placeholderData: keepPreviousData,
	});
};
