"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetWorkflowTemplates } from "@/services/client-api/workflow-template";
import { useImportWorkflow } from "@/services/client-api/workflow-file";
import { API_ROUTES } from "@/config/client-constants";
import type { WorkflowExportPayload } from "@/lib/workflow-export/schema";
import type { WorkflowTemplateListItem } from "@/services/client-api/workflow-template";
import { WorkflowIcon } from "@/components/elements";
import { useAuth } from "@clerk/nextjs";

const TOAST_POSITION = "bottom-center" as const;

function TemplateCard({
	template,
	onUse,
	isLoading,
}: {
	template: WorkflowTemplateListItem;
	onUse: (t: WorkflowTemplateListItem) => void;
	isLoading: boolean;
}) {
	return (
		<button
			type="button"
			onClick={() => onUse(template)}
			disabled={isLoading}
			className="group shrink-0 w-[200px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow transition hover:border-zinc-600 hover:bg-zinc-800/90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
		>
			<div className="relative flex h-[120px] items-center justify-center bg-linear-to-br from-zinc-700 to-zinc-800">
				<WorkflowIcon className="size-12 text-zinc-400 transition group-hover:text-white" />
			</div>
			<div className="border-t border-zinc-700/80 bg-zinc-800/95 px-3 py-2.5">
				<p className="truncate text-left text-sm font-medium text-foreground">
					{template.name}
				</p>
			</div>
		</button>
	);
}

export function PrebuiltWorkflows() {
	const { isSignedIn } = useAuth();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: templates = [], isLoading: isLoadingTemplates } =
		useGetWorkflowTemplates();
	const { mutateAsync: importWorkflow, isPending: isImporting } =
		useImportWorkflow();

	const handleUseTemplate = async (template: WorkflowTemplateListItem) => {
		if (!isSignedIn) {
			toast.error("Sign in to use a template", {
				position: TOAST_POSITION,
			});
			return;
		}
		const toastId = toast.loading("Creating workflow…", {
			position: TOAST_POSITION,
			description: "We're creating your file and importing the template.",
		});
		try {
			const raw = template.json as Partial<WorkflowExportPayload>;
			const payload: WorkflowExportPayload = {
				version: 1,
				name: template.name.trim() || "Untitled workflow",
				nodes: Array.isArray(raw?.nodes) ? raw.nodes : [],
				edges: Array.isArray(raw?.edges) ? raw.edges : [],
			};
			const result = await importWorkflow({ payload });
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_FILE.GET.key],
			});
			toast.dismiss(toastId);
			toast.success("Workflow ready", {
				position: TOAST_POSITION,
				description: `"${result.workflow_name}" created. Opening…`,
			});
			router.push(`/workflow/${result.workflow_id}`);
		} catch (err) {
			toast.dismiss(toastId);
			toast.error("Could not create workflow", {
				position: TOAST_POSITION,
				description:
					err instanceof Error ? err.message : "Please try again.",
			});
		}
	};

	return (
		<section className="w-full">
			<Tabs defaultValue="library" className="w-full">
				<TabsList
					variant="line"
					className="w-fit gap-0 bg-transparent p-0"
				>
					<TabsTrigger
						value="library"
						className="px-4 font-medium tracking-tight"
					>
						Workflow library
					</TabsTrigger>
					<TabsTrigger
						value="tutorials"
						className="px-4 font-medium tracking-tight"
					>
						Tutorials
					</TabsTrigger>
				</TabsList>
				<TabsContent value="library" className="mt-4">
					<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						Prebuilt workflows
					</p>
					{isLoadingTemplates ? (
						<div className="mt-3 flex gap-3 overflow-hidden">
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className="flex h-[120px] w-[200px] shrink-0 animate-pulse rounded-lg bg-zinc-800"
								/>
							))}
						</div>
					) : templates.length === 0 ? (
						<p className="mt-3 text-sm text-muted-foreground">
							No templates yet.
						</p>
					) : (
						<div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
							{templates.map((template) => (
								<TemplateCard
									key={template.id}
									template={template}
									onUse={handleUseTemplate}
									isLoading={isImporting}
								/>
							))}
						</div>
					)}
				</TabsContent>
				<TabsContent value="tutorials" className="mt-4">
					<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
						Tutorials
					</p>
					<p className="mt-3 text-sm text-muted-foreground">
						Coming soon.
					</p>
				</TabsContent>
			</Tabs>
		</section>
	);
}
