import { API_ROUTES } from "@/config/client-constants";

export interface ExecuteWorkflowNodeArgs {
	workflowId: string;
	nodeId: string;
}

export interface ExecuteWorkflowNodeResult {
	workflowExecutionId: string;
	nodeExecutionId: string;
	message: string;
}

export const executeWorkflowNode = async (
	args: ExecuteWorkflowNodeArgs,
): Promise<ExecuteWorkflowNodeResult> => {
	const response = await fetch(
		API_ROUTES.WORKFLOW_NODE.EXECUTE.dynamicPath(
			args.workflowId,
			args.nodeId,
		),
		{
			method: API_ROUTES.WORKFLOW_NODE.EXECUTE.method,
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		},
	);

	const json = (await response.json().catch(() => ({}))) as {
		success?: boolean;
		error?: string;
		data?: ExecuteWorkflowNodeResult;
	};

	if (!response.ok) {
		const msg = json?.error ?? `Failed to start execution: ${response.status}`;
		throw new Error(msg);
	}

	if (!json.success || !json.data) {
		throw new Error(json?.error ?? "Failed to start execution");
	}

	return json.data;
};
