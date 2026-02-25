import { API_ROUTES } from "@/config/client-constants";
import type { WorkflowExportPayload } from "@/lib/workflow-export/schema";
import { JsonApiResponse } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ImportWorkflowResponseData {
	workflow_id: string;
	workflow_name: string;
}

export interface ImportWorkflowArgs {
	payload: WorkflowExportPayload;
}

export const importWorkflow = async (
	args: ImportWorkflowArgs,
): Promise<ImportWorkflowResponseData> => {
	const response = await fetch(API_ROUTES.WORKFLOW_FILE.IMPORT.path, {
		method: API_ROUTES.WORKFLOW_FILE.IMPORT.method,
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(args.payload),
	});

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
		(await response.json()) as JsonApiResponse<ImportWorkflowResponseData>;

	if (!responseData.success || !responseData.data) {
		throw new Error(
			(responseData as { error?: string }).error ?? "Import failed",
		);
	}

	return responseData.data;
};

export const useImportWorkflow = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: importWorkflow,
		mutationKey: [API_ROUTES.WORKFLOW_FILE.IMPORT.key],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_FILE.GET.key],
			});
		},
	});
};
