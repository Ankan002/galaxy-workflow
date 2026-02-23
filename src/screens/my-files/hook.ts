import { useUser } from "@clerk/nextjs";
import { useAPIErrorHandler } from "@/hooks/use-error-handler";
import { useCreateWorkflowFile } from "@/services/client-api/workflow-file";
import { toast } from "sonner";

export const useMyFiles = () => {
	const { APIErrorHandler } = useAPIErrorHandler();
	const { user, isLoaded } = useUser();

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
		user,
		isLoaded,
		handleCreateWorkflowFile,
		isCreatingWorkflowFile,
	};
};
