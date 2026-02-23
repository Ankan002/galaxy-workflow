"use client";

import { DashboardProvider } from "@/components/providers";
import { useMyFiles } from "./hook";
import { Button } from "@/components/ui";
import { Plus } from "lucide-react";

const MyFilesScreen = () => {
	const { user, isLoaded } = useMyFiles();

	return (
		<DashboardProvider
			isHeadingLoading={!isLoaded}
			heading={user ? `${user.fullName}'s Workspace` : "Workspace"}
			ActionButton={
				<Button className="rounded-sm">
					<Plus />
					<span>Create New File</span>
				</Button>
			}
		>
			<></>
		</DashboardProvider>
	);
};

export default MyFilesScreen;
