export interface ExecutionMeta {
	workflowId: string;
	nodeId: string;
	nodeExecutionId: string;
	workflowExecutionId: string;
	completionUrl: string;
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

/** Header sent to the complete hook; server must accept this. */
export const EXECUTION_COMPLETE_HEADER_KEY = "abc";

export async function notifyExecutionComplete(
	meta: ExecutionMeta,
	output: Record<string, unknown> | null,
	error: string | null,
): Promise<void> {
	const res = await fetch(meta.completionUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-complete-key": EXECUTION_COMPLETE_HEADER_KEY,
		},
		body: JSON.stringify({
			execution_id: meta.workflowExecutionId,
			execution_node_id: meta.nodeExecutionId,
			node_id: meta.nodeId,
			workflow_id: meta.workflowId,
			output: output ?? null,
			error: error ?? null,
		}),
	});
	if (!res.ok) {
		console.error(
			`Execution callback failed: ${res.status} ${res.statusText}`,
			await res.text(),
		);
	}
}
