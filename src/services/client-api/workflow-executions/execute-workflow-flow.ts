import { API_ROUTES } from "@/config/client-constants";

export interface ExecuteWorkflowFlowArgs {
	workflowId: string;
}

export interface ExecuteWorkflowFlowResult {
	workflowExecutionId: string;
	nodeExecutionIds: string[];
	message: string;
}

export async function executeWorkflowFlow(
	args: ExecuteWorkflowFlowArgs,
): Promise<ExecuteWorkflowFlowResult> {
	const response = await fetch(
		API_ROUTES.WORKFLOW_EXECUTE_FLOW.dynamicPath(args.workflowId),
		{
			method: API_ROUTES.WORKFLOW_EXECUTE_FLOW.method,
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		},
	);

	const json = (await response.json().catch(() => ({}))) as {
		success?: boolean;
		error?: string;
		data?: ExecuteWorkflowFlowResult;
	};

	if (!response.ok) {
		const msg = json?.error ?? `Failed to start flow: ${response.status}`;
		throw new Error(msg);
	}

	if (!json.success || !json.data) {
		throw new Error(json?.error ?? "Failed to start flow");
	}

	return json.data;
}
