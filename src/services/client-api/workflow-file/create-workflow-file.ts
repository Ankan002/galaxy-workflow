import { API_ROUTES } from "@/config/client-constants";
import { workflow_file } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { clientUtils } from "@/utils/client";
import { useMutation } from "@tanstack/react-query";

interface CreateWorkflowFileResponseData {
	workflow_file: workflow_file;
}

export const createWorkflowFile = async () => {
	const response = await fetch(API_ROUTES.WORKFLOW_FILE.CREATE.path, {
		method: API_ROUTES.WORKFLOW_FILE.CREATE.method,
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			name: clientUtils.nameGenerator.generate(),
		}),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to create workflow file: ${response.statusText}`,
		);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<CreateWorkflowFileResponseData>;

	if (!responseData.success) {
		throw new Error(
			`Failed to create workflow file: ${responseData.error}`,
		);
	}

	if (!responseData.data) {
		throw new Error(`Failed to create workflow file!`);
	}

	return responseData.data.workflow_file;
};

export const useCreateWorkflowFile = () => {
	return useMutation({
		mutationFn: createWorkflowFile,
		mutationKey: [API_ROUTES.WORKFLOW_FILE.CREATE.key],
	});
};
