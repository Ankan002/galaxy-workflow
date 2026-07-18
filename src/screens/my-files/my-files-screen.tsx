"use client";

import { DashboardProvider } from "@/components/providers";
import { useMyFiles } from "./hook";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Label,
} from "@/components/ui";
import { Loader2, Plus, Search } from "lucide-react";
import { WorkflowIcon } from "@/components/elements";
import { PrebuiltWorkflows, SkeletonCard, WorkflowFileCard } from "./components";

const MyFilesScreen = () => {
	const {
		user,
		isLoaded,
		handleCreateWorkflowFile,
		isCreatingWorkflowFile,
		handleDeleteWorkflowFile,
		handleOpenRename,
		handleRenameSubmit,
		renameDialogOpen,
		setRenameDialogOpen,
		renameValue,
		setRenameValue,
		fileToRename,
		isRenaming,
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
			{search.length === 0 && <PrebuiltWorkflows />}
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
					<WorkflowIcon className="size-10 text-muted-foreground" />
					<p className="mt-5 font-display text-2xl tracking-tight">
						Nothing here yet!
					</p>
					<p className="text-muted-foreground text-sm mt-1">
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
						<p className="ak-eyebrow">My files</p>
						<div className="flex items-center gap-2">
							<InputGroup
								variant="search"
								className="w-44 h-8"
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
									onRename={handleOpenRename}
									onDelete={handleDeleteWorkflowFile}
								/>
							))}
						</div>
					)}
				</div>
			)}

			<Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Rename workflow</DialogTitle>
					</DialogHeader>
					<div className="grid gap-2 py-2">
						<Label htmlFor="dashboard-rename-input">Name</Label>
						<Input
							id="dashboard-rename-input"
							value={renameValue}
							onChange={(e) => setRenameValue(e.target.value)}
							placeholder="Workflow name"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleRenameSubmit();
							}}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRenameDialogOpen(false)}
							disabled={isRenaming}
						>
							Cancel
						</Button>
						<Button
							onClick={handleRenameSubmit}
							disabled={
								!renameValue.trim() ||
								(fileToRename != null &&
									renameValue.trim() === fileToRename.name) ||
								isRenaming
							}
						>
							{isRenaming && (
								<Loader2 className="size-4 shrink-0 animate-spin" />
							)}
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DashboardProvider>
	);
};

export default MyFilesScreen;
