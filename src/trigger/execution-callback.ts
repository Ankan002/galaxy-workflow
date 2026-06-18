import { tasks } from "@trigger.dev/sdk";

export interface ExecutionMeta {
	workflowId: string;
	nodeId: string;
	nodeExecutionId: string;
	workflowExecutionId: string;
}

export function stripExecutionMeta<T>(
	payload: T & { _executionMeta?: ExecutionMeta },
): { payload: Omit<T, "_executionMeta">; meta: ExecutionMeta | null } {
	const { _executionMeta, ...rest } = payload as T & {
		_executionMeta?: ExecutionMeta;
	};
	return {
		payload: rest as Omit<T, "_executionMeta">,
		meta: _executionMeta ?? null,
	};
}

/** On task completion: triggers process-node-completion which updates the node and runs batch.triggerAndWait for next nodes. No webhook. */
export async function handleExecutionComplete(
	meta: ExecutionMeta,
	output: Record<string, unknown> | null,
	error: string | null,
): Promise<void> {
	await tasks.trigger("process-node-completion", {
		workflowId: meta.workflowId,
		workflowExecutionId: meta.workflowExecutionId,
		nodeExecutionId: meta.nodeExecutionId,
		nodeId: meta.nodeId,
		output,
		error,
	});
}
