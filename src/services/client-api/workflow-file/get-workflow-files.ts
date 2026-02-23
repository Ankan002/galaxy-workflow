import { API_ROUTES } from "@/config/client-constants";
import { workflow_file } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import {
	keepPreviousData,
	QueryFunctionContext,
	useQuery,
} from "@tanstack/react-query";

interface GetWorkflowFilesResponseData {
	workflow_files: workflow_file[];
}

const getWorkflowFiles = async (args: QueryFunctionContext) => {
	const { queryKey } = args;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, query] = queryKey;

	const queries = new URLSearchParams({
		query: query as string,
	});

	const response = await fetch(
		`${API_ROUTES.WORKFLOW_FILE.GET.path}?${queries.toString()}`,
		{
			method: API_ROUTES.WORKFLOW_FILE.GET.method,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to get workflow files: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GetWorkflowFilesResponseData>;

	if (!responseData.success) {
		throw new Error(`Failed to get workflow files: ${responseData.error}`);
	}

	if (!responseData.data) {
		throw new Error(`Failed to get workflow files!`);
	}

	return responseData.data.workflow_files;
};

interface HookArgs {
	query?: string;
}

export const useGetWorkflowFiles = (args: HookArgs) => {
	const { isSignedIn } = useAuth();

	return useQuery({
		queryKey: [API_ROUTES.WORKFLOW_FILE.GET.key, args.query],
		queryFn: getWorkflowFiles,
		enabled: isSignedIn,
		placeholderData: keepPreviousData,
	});
};
