import { API_ROUTES } from "@/config/client-constants";
import type { WorkflowExportPayload } from "@/lib/workflow-export/schema";
import { JsonApiResponse } from "@/types/api";

interface ExportWorkflowResponseData {
	version: number;
	name: string;
	nodes: WorkflowExportPayload["nodes"];
	edges: WorkflowExportPayload["edges"];
}

export interface ExportWorkflowArgs {
	workflowId: string;
}

export async function exportWorkflow(
	args: ExportWorkflowArgs,
): Promise<WorkflowExportPayload> {
	const response = await fetch(
		API_ROUTES.WORKFLOW_FILE.EXPORT.dynamicPath(args.workflowId),
		{
			method: API_ROUTES.WORKFLOW_FILE.EXPORT.method,
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		},
	);

	if (!response.ok) {
		const body = (await response.json().catch(() => ({}))) as { error?: string };
		throw new Error(body?.error ?? `Export failed: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<ExportWorkflowResponseData>;

	if (!responseData.success || !responseData.data) {
		throw new Error(
			(responseData as { error?: string }).error ?? "Export failed",
		);
	}

	const d = responseData.data;
	return {
		version: 1,
		name: d.name,
		nodes: d.nodes,
		edges: d.edges,
	} as WorkflowExportPayload;
}
