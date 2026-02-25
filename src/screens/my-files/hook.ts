import { useUser } from "@clerk/nextjs";
import { useAPIErrorHandler } from "@/hooks/use-error-handler";
import {
	useCreateWorkflowFile,
	useDeleteWorkflowFile,
	useGetWorkflowFiles,
} from "@/services/client-api/workflow-file";
import { toast } from "sonner";
import { useEffect } from "react";
import { useDebounce, useDebouncedCallback } from "use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DEBOUNCE_TIME, API_ROUTES } from "@/config/client-constants";
import { clientUtils } from "@/utils/client";
import { workflow_file } from "@/db/prisma/client";
import { useFileSearchStore } from "@/store/file-search.store";

export const useMyFiles = () => {
	const { APIErrorHandler } = useAPIErrorHandler();
	const { user, isLoaded } = useUser();
	const queryClient = useQueryClient();
	const router = useRouter();

	const { search, setSearch } = useFileSearchStore();

	const [debouncedSearch] = useDebounce(search, DEBOUNCE_TIME);
	const onDebouncedSearchChange = useDebouncedCallback(
		() => {},
		DEBOUNCE_TIME,
	);

	const {
		mutateAsync: createWorkflowFile,
		isPending: isCreatingWorkflowFile,
	} = useCreateWorkflowFile();
	const {
		data: workflowFiles,
		isLoading: isLoadingWorkflowFiles,
		error: workflowFilesError,
	} = useGetWorkflowFiles({
		query: debouncedSearch,
	});

	const { mutateAsync: deleteWorkflowFile } = useDeleteWorkflowFile();

	const createWorkflowFileErrorHandler = APIErrorHandler();
	const getWorkflowFilesErrorHandler = APIErrorHandler();
	const deleteWorkflowFileErrorHandler = APIErrorHandler();

	const handleCreateWorkflowFile = async () => {
		if (isCreatingWorkflowFile) {
			toast.error(
				"Please wait for the current workflow file to be created before creating a new one!",
			);
			return;
		}

		try {
			const newFile = await createWorkflowFile();
			queryClient.setQueryData<workflow_file[]>(
				[API_ROUTES.WORKFLOW_FILE.GET.key, debouncedSearch],
				(prev) => (prev ? [newFile, ...prev] : [newFile]),
			);
			toast.success("Workflow file created successfully!");
			router.push(`/workflow/${newFile.id}`);
		} catch (error) {
			createWorkflowFileErrorHandler(error);
		}
	};

	const handleDeleteWorkflowFile = async (workflowId: string) => {
		try {
			await deleteWorkflowFile(workflowId);
			queryClient.setQueryData<workflow_file[]>(
				[API_ROUTES.WORKFLOW_FILE.GET.key, debouncedSearch],
				(prev) => (prev ?? []).filter((f) => f.id !== workflowId),
			);
			toast.success("Workflow deleted");
		} catch (error) {
			deleteWorkflowFileErrorHandler(error);
		}
	};

	useEffect(() => {
		if (workflowFilesError) {
			getWorkflowFilesErrorHandler(workflowFilesError);
		}
	}, [workflowFilesError, getWorkflowFilesErrorHandler]);

	useEffect(() => {
		if (workflowFiles !== undefined && workflowFiles !== null) {
			console.log({ workflowFiles });
		}
	}, [workflowFiles]);

	return {
		user,
		isLoaded,
		handleCreateWorkflowFile,
		isCreatingWorkflowFile,
		handleDeleteWorkflowFile,
		isLoadingWorkflowFiles,
		workflowFiles,
		search,
		onSearchChange: clientUtils.uiEventsHandler.onTextInputChange(
			setSearch,
			onDebouncedSearchChange,
		),
	};
};
