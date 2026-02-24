"use client";

import { useMemo, useState, useCallback } from "react";
import {
	Type,
	ImagePlus,
	Video,
	Sparkles,
	Crop,
	Film,
	ChevronDown,
	LayoutDashboard,
	FilePlus,
	Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowSidebarProps } from "./canvas-workflow-layout";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand";
import { NODE_REGISTRY, NodeType } from "./nodes/registry";

const DRAG_TYPE = "application/reactflow";

/** Quick Access node types (order matches spec). */
const QUICK_ACCESS_TYPES: NodeType[] = [
	NodeType.TEXT,
	NodeType.IMAGE_UPLOAD,
	NodeType.VIDEO_UPLOAD,
	NodeType.RUN_LLM,
	NodeType.CROP_IMAGE,
	NodeType.EXTRACT_VIDEO_FRAME,
];

const NODE_ICONS: Record<
	NodeType,
	React.ComponentType<{ className?: string }>
> = {
	[NodeType.TEXT]: Type,
	[NodeType.IMAGE_UPLOAD]: ImagePlus,
	[NodeType.VIDEO_UPLOAD]: Video,
	[NodeType.RUN_LLM]: Sparkles,
	[NodeType.CROP_IMAGE]: Crop,
	[NodeType.EXTRACT_VIDEO]: Film,
	[NodeType.EXTRACT_VIDEO_FRAME]: Film,
};

function formatHandleSummary(
	inputs: { key: string; type: string }[],
	outputs: { key: string; type: string }[],
): string {
	const inStr = inputs.length ? inputs.map((h) => h.type).join(", ") : "—";
	const outStr = outputs.length ? outputs.map((h) => h.type).join(", ") : "—";
	return `${inStr} → ${outStr}`;
}

interface CanvasNodeSidebarProps {
	workflowSidebar: WorkflowSidebarProps;
	collapsed: boolean;
}

export function CanvasNodeSidebar({
	workflowSidebar,
	collapsed,
}: CanvasNodeSidebarProps) {
	const [search, setSearch] = useState("");
	const [hoveredType, setHoveredType] = useState<NodeType | null>(null);
	const [fromInputToOutput, setFromInputToOutput] = useState(false);

	const {
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
	} = workflowSidebar;

	const filteredAndOrdered = useMemo(() => {
		const lower = search.trim().toLowerCase();
		let list = lower
			? QUICK_ACCESS_TYPES.filter(
					(type) =>
						NODE_REGISTRY[type].label
							.toLowerCase()
							.includes(lower) ||
						NODE_REGISTRY[type].description
							.toLowerCase()
							.includes(lower),
				)
			: [...QUICK_ACCESS_TYPES];
		if (fromInputToOutput) {
			list = [...list].sort((a, b) => {
				const defA = NODE_REGISTRY[a];
				const defB = NODE_REGISTRY[b];
				return defA.inputHandles.length - defB.inputHandles.length;
			});
		}
		return list;
	}, [search, fromInputToOutput]);

	const handleDragStart = useCallback(
		(e: React.DragEvent, type: NodeType) => {
			e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ type }));
			e.dataTransfer.effectAllowed = "move";
		},
		[],
	);

	return (
		<aside
			className={cn(
				"flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground font-sans transition-[width] duration-200 ease-linear",
				collapsed ? "w-18" : "w-64 min-w-64",
			)}
		>
			{/* Header: logo dropdown (Back to dashboard, New file, Rename) */}
			<div
				className={cn(
					"flex flex-col gap-3 py-4",
					collapsed ? "px-2" : "px-3",
				)}
			>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className={cn(
								"flex min-w-0 shrink-0 items-center gap-2 rounded-lg outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent focus-visible:ring-2",
								collapsed
									? "justify-center px-2 py-1"
									: "w-full px-2 py-1.5",
							)}
							aria-label="Workflow menu"
						>
							<Logo className="size-8 shrink-0" />
							{!collapsed && (
								<>
									<span className="truncate text-left text-sm font-semibold text-sidebar-foreground">
										{workflowFile?.name ?? "…"}
									</span>
									<ChevronDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/70" />
								</>
							)}
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="start"
						side="bottom"
						className="min-w-60"
					>
						<DropdownMenuItem
							onClick={onBackToDashboard}
							className="flex items-center gap-2"
						>
							<LayoutDashboard className="size-4" />
							Back to dashboard
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={onNewFile}
							disabled={isCreatingNewFile}
							className="flex items-center gap-2"
						>
							<FilePlus className="size-4" />
							New file
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={onOpenRename}
							className="flex items-center gap-2"
						>
							<Pencil className="size-4" />
							Rename file
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{!collapsed && (
					<span className="px-1 text-xs font-medium uppercase tracking-widest text-sidebar-foreground/70">
						Nodes
					</span>
				)}

				{!collapsed && (
					<>
						<Input
							variant="search"
							inputSize="sm"
							placeholder="Search nodes…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8"
						/>
						<button
							type="button"
							onClick={() => setFromInputToOutput((v) => !v)}
							className={cn(
								"flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
								fromInputToOutput
									? "bg-accent text-accent-foreground"
									: "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							)}
						>
							From Input to Output
						</button>
					</>
				)}
			</div>

			<div
				className={cn(
					"flex min-h-0 flex-1 flex-col gap-2 overflow-visible pb-5 pt-0",
					collapsed ? "px-2" : "px-3",
				)}
			>
				{!collapsed && (
					<p className="px-1 text-xs font-medium uppercase tracking-widest text-sidebar-foreground/70">
						Quick Access
					</p>
				)}
				<ScrollArea className="min-h-0 flex-1 overflow-x-visible">
					<div
						className={cn(
							"flex flex-col py-2",
							collapsed
								? "items-center gap-3 px-0"
								: "gap-2 pl-0.5 pr-3",
						)}
					>
						{filteredAndOrdered.map((type) => {
							const def = NODE_REGISTRY[type];
							const Icon = NODE_ICONS[type];
							const isHovered = hoveredType === type;
							return (
								<div
									key={type}
									className="relative flex items-stretch justify-center"
									onMouseEnter={() => setHoveredType(type)}
									onMouseLeave={() => setHoveredType(null)}
								>
									<Card
										variant="node"
										padding="sm"
										draggable
										onDragStart={(e) =>
											handleDragStart(e, type)
										}
										title={
											collapsed ? def.label : undefined
										}
										className={cn(
											"flex flex-1 min-w-0 cursor-grab active:cursor-grabbing items-center rounded-xl border-2 transition-colors hover:border-accent hover:bg-sidebar-accent/50",
											collapsed
												? "w-10 flex-none justify-center rounded-xl p-2"
												: "gap-2.5 px-2 py-2.5",
											isHovered &&
												"border-accent bg-sidebar-accent/50",
										)}
									>
										{Icon && (
											<div
												className={cn(
													"flex shrink-0 items-center justify-center rounded-lg bg-accent text-foreground",
													collapsed
														? "bg-transparent"
														: "size-6",
												)}
											>
												<Icon
													className={
														collapsed
															? "size-3"
															: "size-3"
													}
												/>
											</div>
										)}
										{!collapsed && (
											<span className="truncate text-xs font-medium">
												{def.label}
											</span>
										)}
									</Card>
									{isHovered && !collapsed && (
										<div className="absolute left-full top-0 z-50 ml-2 w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
											<p className="font-medium">
												{def.label}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{def.description}
											</p>
											<div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
												<Badge
													variant="outline"
													className="font-normal"
												>
													{formatHandleSummary(
														def.inputHandles,
														def.outputHandles,
													)}
												</Badge>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</ScrollArea>
			</div>

			<Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Rename file</DialogTitle>
					</DialogHeader>
					<div className="grid gap-2 py-2">
						<Label htmlFor="rename-input">Name</Label>
						<Input
							id="rename-input"
							value={renameValue}
							onChange={(e) => setRenameValue(e.target.value)}
							placeholder="Workflow name"
							onKeyDown={(e) => {
								if (e.key === "Enter") onRenameSubmit();
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
							onClick={onRenameSubmit}
							disabled={
								!renameValue.trim() ||
								renameValue.trim() === workflowFile?.name ||
								isRenaming
							}
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</aside>
	);
}
