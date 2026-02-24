import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DASHBOARD_URL } from "@/config/client-constants";
import { useAPIErrorHandler } from "@/hooks/use-error-handler";
import {
	useCreateWorkflowFile,
	useGetWorkflowFile,
	useUpdateWorkflowFile,
} from "@/services/client-api/workflow-file";

interface UseWorkflowFileArgs {
	workflowId: string;
}

export const useWorkflowFile = ({ workflowId }: UseWorkflowFileArgs) => {
	const router = useRouter();
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);
	const [renameValue, setRenameValue] = useState("");

	const { APIErrorHandler } = useAPIErrorHandler();
	const getWorkflowFileErrorHandler = APIErrorHandler();
	const createWorkflowFileErrorHandler = APIErrorHandler();
	const updateWorkflowFileErrorHandler = APIErrorHandler();

	const {
		data: workflowFile,
		error: workflowFileError,
	} = useGetWorkflowFile({ workflowId });
	const {
		mutateAsync: createWorkflowFile,
		isPending: isCreatingNewFile,
	} = useCreateWorkflowFile();
	const {
		mutateAsync: updateWorkflowFile,
		isPending: isRenaming,
	} = useUpdateWorkflowFile(workflowId);

	useEffect(() => {
		if (workflowFileError) {
			getWorkflowFileErrorHandler(workflowFileError);
		}
	}, [workflowFileError, getWorkflowFileErrorHandler]);

	const onBackToDashboard = useCallback(() => {
		router.push(DASHBOARD_URL);
	}, [router]);

	const onNewFile = useCallback(async () => {
		if (isCreatingNewFile) {
			toast.error(
				"Please wait for the current workflow file to be created before creating a new one!",
			);
			return;
		}
		try {
			const file = await createWorkflowFile();
			toast.success("Workflow file created successfully!");
			router.push(`/workflow/${file.id}`);
		} catch (error) {
			createWorkflowFileErrorHandler(error);
		}
	}, [
		isCreatingNewFile,
		createWorkflowFile,
		router,
		createWorkflowFileErrorHandler,
	]);

	const onOpenRename = useCallback(() => {
		setRenameValue(workflowFile?.name ?? "");
		setRenameDialogOpen(true);
	}, [workflowFile?.name]);

	const onRenameSubmit = useCallback(async () => {
		const name = renameValue.trim();
		if (!name) return;
		try {
			await updateWorkflowFile(name);
			setRenameDialogOpen(false);
			toast.success("Workflow file renamed successfully!");
		} catch (error) {
			updateWorkflowFileErrorHandler(error);
		}
	}, [
		renameValue,
		updateWorkflowFile,
		updateWorkflowFileErrorHandler,
	]);

	return {
		workflowFile,
		onBackToDashboard,
		onNewFile,
		onOpenRename,
		onRenameSubmit,
		renameDialogOpen,
		setRenameDialogOpen,
		renameValue,
		setRenameValue,
		isCreatingNewFile,
		isRenaming,
	};
};
