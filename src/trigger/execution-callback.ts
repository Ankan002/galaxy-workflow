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
	const { _executionMeta, ...rest } = payload as T & { _executionMeta?: ExecutionMeta };
	return { payload: rest as Omit<T, "_executionMeta">, meta: _executionMeta ?? null };
}

export async function notifyExecutionComplete(
	meta: ExecutionMeta,
	output: Record<string, unknown> | null,
	error: string | null,
): Promise<void> {
	const secret = process.env["TRIGGER_SECRET_KEY"];
	if (!secret) {
		console.warn("TRIGGER_SECRET_KEY not set, skipping execution callback");
		return;
	}
	const res = await fetch(meta.completionUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${secret}`,
		},
		body: JSON.stringify({
			nodeExecutionId: meta.nodeExecutionId,
			workflowId: meta.workflowId,
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

/**
 * Trigger.dev v4 onComplete params: { ctx, payload, task, result, signal, init? }.
 * result is { ok: true, data: TOutput } | { ok: false, error: unknown }.
 * Call this from task onComplete to notify our API of node execution outcome.
 */
export async function handleExecutionOnComplete(params: {
	payload: unknown;
	result: { ok: true; data: unknown } | { ok: false; error: unknown };
}): Promise<void> {
	const meta = (params.payload as { _executionMeta?: ExecutionMeta })
		?._executionMeta;
	if (!meta) return;

	const ok = params.result.ok;
	const output = ok
		? (params.result.data as Record<string, unknown>)
		: null;
	const error = !ok
		? (params.result.error instanceof Error
				? params.result.error.message
				: String(params.result.error))
		: null;

	await notifyExecutionComplete(meta, output, error);
}
