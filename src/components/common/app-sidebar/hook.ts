import { useAPIErrorHandler } from "@/hooks/use-error-handler";
import { useCreateWorkflowFile } from "@/services/client-api/workflow-file";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export const useAppSidebar = () => {
	const { APIErrorHandler } = useAPIErrorHandler();
	const pathname = usePathname();

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
			const response = await createWorkflowFile();
			console.log(response);
			// TODO: Handle the page redirection here!
			toast.success("Workflow file created successfully!");
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
