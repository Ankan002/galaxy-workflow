import { API_ROUTES } from "@/config/client-constants";
import { workflow_node } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateWorkflowNodeResponseData {
	workflow_node: workflow_node;
}

export interface CreateWorkflowNodeArgs {
	workflowId: string;
	type: string;
	provider: string;
	positionX: number;
	positionY: number;
	config?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export const createWorkflowNode = async (
	args: CreateWorkflowNodeArgs,
): Promise<workflow_node> => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_NODES.CREATE.dynamicPath(args.workflowId),
		{
			method: API_ROUTES.WORKFLOW_NODES.CREATE.method,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: args.type,
				provider: args.provider,
				positionX: args.positionX,
				positionY: args.positionY,
				config: args.config ?? {},
				metadata: args.metadata,
			}),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to create workflow node: ${response.statusText}`,
		);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<CreateWorkflowNodeResponseData>;

	if (!responseData.success) {
		throw new Error(
			`Failed to create workflow node: ${responseData.error}`,
		);
	}

	if (!responseData.data) {
		throw new Error(`Failed to create workflow node!`);
	}

	return responseData.data.workflow_node;
};

export const useCreateWorkflowNode = (workflowId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (args: Omit<CreateWorkflowNodeArgs, "workflowId">) =>
			createWorkflowNode({ ...args, workflowId }),
		mutationKey: [API_ROUTES.WORKFLOW_NODES.CREATE.key, workflowId],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_NODES.LIST.key, workflowId],
			});
		},
	});
};
