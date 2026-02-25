import { API_ROUTES } from "@/config/client-constants";
import { JsonApiResponse } from "@/types/api/json-api-response";
import {
	type QueryFunctionContext,
	useQuery,
} from "@tanstack/react-query";

export interface WorkflowTemplateListItem {
	id: string;
	name: string;
	/** Stored export payload (version, name, nodes, edges). */
	json: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

interface GetWorkflowTemplatesResponseData {
	workflow_templates: WorkflowTemplateListItem[];
}

const getWorkflowTemplates = async (args: QueryFunctionContext) => {
	const { queryKey } = args;
	const [_key, search] = queryKey as [string, string | undefined];

	const params = new URLSearchParams();
	if (search?.trim()) params.set("search", search.trim());

	const url = `${API_ROUTES.WORKFLOW_TEMPLATE.LIST.path}${params.toString() ? `?${params.toString()}` : ""}`;
	const response = await fetch(url, {
		method: API_ROUTES.WORKFLOW_TEMPLATE.LIST.method,
		headers: { "Content-Type": "application/json" },
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`Failed to get workflow templates: ${response.statusText}`);
	}

	const data = (await response.json()) as JsonApiResponse<GetWorkflowTemplatesResponseData>;
	if (!data.success || !data.data) {
		throw new Error((data as { error?: string }).error ?? "Failed to get templates");
	}

	return data.data.workflow_templates;
};

interface HookArgs {
	search?: string;
}

export const useGetWorkflowTemplates = (args: HookArgs = {}) => {
	return useQuery({
		queryKey: [API_ROUTES.WORKFLOW_TEMPLATE.LIST.key, args.search],
		queryFn: getWorkflowTemplates,
	});
};
