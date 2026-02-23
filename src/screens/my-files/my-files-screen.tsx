"use client";

import { DashboardProvider } from "@/components/providers";
import { useMyFiles } from "./hook";
import { Button } from "@/components/ui";
import { Loader2, Plus } from "lucide-react";

const MyFilesScreen = () => {
	const { user, isLoaded, handleCreateWorkflowFile, isCreatingWorkflowFile } =
		useMyFiles();

	return (
		<DashboardProvider
			isHeadingLoading={!isLoaded}
			heading={user ? `${user.fullName}'s Workspace` : "Workspace"}
			ActionButton={
				<Button
					className="rounded-sm"
					onClick={handleCreateWorkflowFile}
					disabled={isCreatingWorkflowFile}
				>
					{isCreatingWorkflowFile ? (
						<Loader2 className="animate-spin" />
					) : (
						<Plus />
					)}
					<span>Create New File</span>
				</Button>
			}
		>
			<></>
		</DashboardProvider>
	);
};

export default MyFilesScreen;
