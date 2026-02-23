"use client";

import { DashboardProvider } from "@/components/providers";
import { useMyFiles } from "./hook";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui";
import { Loader2, Plus, Search, Volleyball } from "lucide-react";
import { SkeletonCard, WorkflowFileCard } from "./components";

const MyFilesScreen = () => {
	const {
		user,
		isLoaded,
		handleCreateWorkflowFile,
		isCreatingWorkflowFile,
		isLoadingWorkflowFiles,
		onSearchChange,
		search,
		workflowFiles,
	} = useMyFiles();

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
			{isLoadingWorkflowFiles && workflowFiles === undefined && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
					{Array.from({ length: 16 }).map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			)}

			{workflowFiles !== undefined &&
			workflowFiles !== null &&
			search.length === 0 && // TODO: Fix disappearing behaviour
			workflowFiles.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center">
					<Volleyball size={40} strokeWidth={1} />
					<p className="mt-5 font-medium text-lg tracking-wide">
						Nothing here yet!
					</p>
					<p className="text-muted-foreground text-xs mt-1">
						Start weaving to bring your ideas to life.
					</p>
					<Button
						className="mt-6 rounded-sm cursor-pointer text-xs h-8"
						variant="outline"
						onClick={handleCreateWorkflowFile}
						disabled={isCreatingWorkflowFile}
					>
						Create New File
					</Button>
				</div>
			) : (
				<div className="w-full flex flex-col">
					<div className="w-full flex items-center justify-between mt-4">
						<p className="text-sm font-medium">My Files</p>
						<div className="flex items-center gap-2">
							<InputGroup
								variant="search"
								className="w-44 h-8 rounded-xs border-secondary"
							>
								<InputGroupInput
									placeholder="Search"
									value={search}
									onChange={onSearchChange}
									className="placeholder:text-xs text-xs"
								/>
								<InputGroupAddon align="inline-start">
									<Search className="text-muted-foreground size-3" />
								</InputGroupAddon>
							</InputGroup>
						</div>
					</div>
					{workflowFiles && workflowFiles.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
							{workflowFiles.map((file) => (
								<WorkflowFileCard
									key={file.id}
									file={file}
									href={`/workflow/${file.id}`}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</DashboardProvider>
	);
};

export default MyFilesScreen;
