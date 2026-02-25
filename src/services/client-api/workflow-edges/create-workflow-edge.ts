import { API_ROUTES } from "@/config/client-constants";
import { workflow_edge } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateWorkflowEdgeResponseData {
	workflow_edge: workflow_edge;
}

export interface CreateWorkflowEdgeArgs {
	workflowId: string;
	sourceNodeId: string;
	targetNodeId: string;
	sourceHandle: string;
	targetHandle: string;
}

export const createWorkflowEdge = async (
	args: CreateWorkflowEdgeArgs,
): Promise<workflow_edge> => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_EDGES.CREATE.dynamicPath(args.workflowId),
		{
			method: API_ROUTES.WORKFLOW_EDGES.CREATE.method,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sourceNodeId: args.sourceNodeId,
				targetNodeId: args.targetNodeId,
				sourceHandle: args.sourceHandle,
				targetHandle: args.targetHandle,
			}),
		},
	);

	if (!response.ok) {
		let message = response.statusText;
		try {
			const body = (await response.json()) as { error?: string };
			if (body?.error) message = body.error;
		} catch {
			// ignore
		}
		throw new Error(message);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<CreateWorkflowEdgeResponseData>;

	if (!responseData.success) {
		throw new Error(
			`Failed to create workflow edge: ${responseData.error}`,
		);
	}

	if (!responseData.data) {
		throw new Error(`Failed to create workflow edge!`);
	}

	return responseData.data.workflow_edge;
};

export const useCreateWorkflowEdge = (workflowId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (args: Omit<CreateWorkflowEdgeArgs, "workflowId">) =>
			createWorkflowEdge({ ...args, workflowId }),
		mutationKey: [API_ROUTES.WORKFLOW_EDGES.CREATE.key, workflowId],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_EDGES.LIST.key, workflowId],
			});
		},
	});
};
