import { API_ROUTES, DEBOUNCE_TIME } from "@/config/client-constants";
import { workflow_file } from "@/db/prisma/browser";
import { useAPIErrorHandler } from "@/hooks/use-error-handler";
import { useCreateWorkflowFile } from "@/services/client-api/workflow-file";
import { useFileSearchStore } from "@/store";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export const useAppSidebar = () => {
	const { APIErrorHandler } = useAPIErrorHandler();
	const pathname = usePathname();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { search } = useFileSearchStore();

	const [debouncedSearch] = useDebounce(search, DEBOUNCE_TIME);

	const {
		mutateAsync: createWorkflowFile,
		isPending: isCreatingWorkflowFile,
	} = useCreateWorkflowFile();

	const createWorkflowFileErrorHandler = APIErrorHandler();

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

	return {
		handleCreateWorkflowFile,
		isCreatingWorkflowFile,
		pathname,
	};
};
