"use client";

import { useCallback } from "react";
import { Loader2, PanelRight, PanelRightClose, Play, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExecutionHistory } from "./execution-history";

export interface CanvasRightSidebarProps {
	/** Whether the sidebar is collapsed (only buttons visible). */
	collapsed: boolean;
	onToggleCollapsed: () => void;
	/** True when exactly one node is selected (run-selected is enabled). */
	hasSelectedNode: boolean;
	onRunSelectedNode: () => void;
	onTriggerFlow: () => void;
	/** Optional: disable both actions (e.g. when editor is loading). */
	disabled?: boolean;
	/** True while run-selected-node is queuing (disables Run node, shows spinner). */
	isRunNodeLoading?: boolean;
	/** True while run-flow is queuing (disables Run flow, shows spinner). */
	isRunFlowLoading?: boolean;
	/** Workflow ID for execution history. */
	workflowId: string;
}

export function CanvasRightSidebar({
	collapsed,
	onToggleCollapsed,
	hasSelectedNode,
	onRunSelectedNode,
	onTriggerFlow,
	disabled = false,
	isRunNodeLoading = false,
	isRunFlowLoading = false,
	workflowId,
}: CanvasRightSidebarProps) {
	const runNodeDisabled = !hasSelectedNode || disabled || isRunNodeLoading;
	const runFlowDisabled = disabled || isRunFlowLoading;

	const handleRunSelected = useCallback(() => {
		if (runNodeDisabled) return;
		onRunSelectedNode();
	}, [runNodeDisabled, onRunSelectedNode]);

	const handleTriggerFlow = useCallback(() => {
		if (runFlowDisabled) return;
		onTriggerFlow();
	}, [runFlowDisabled, onTriggerFlow]);

	if (collapsed) {
		return (
			<aside
				className={cn(
					"flex h-full w-14 shrink-0 flex-col items-center gap-2 border-l border-sidebar-border bg-sidebar py-4 text-sidebar-foreground transition-[width] duration-200 ease-linear",
				)}
			>
				<Button
					variant="outline"
					size="icon"
					className="size-9 shrink-0"
					title="Run selected node"
					disabled={runNodeDisabled}
					onClick={handleRunSelected}
					aria-label="Run selected node"
				>
					{isRunNodeLoading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Play className="size-4" />
					)}
				</Button>
				<Button
					variant="outline"
					size="icon"
					className="size-9 shrink-0"
					title="Trigger whole flow"
					disabled={runFlowDisabled}
					onClick={handleTriggerFlow}
					aria-label="Trigger whole flow"
				>
					{isRunFlowLoading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Workflow className="size-4" />
					)}
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="mt-auto size-9 shrink-0"
					title="Expand sidebar"
					onClick={onToggleCollapsed}
					aria-label="Expand sidebar"
				>
					<PanelRight className="size-4" />
				</Button>
			</aside>
		);
	}

	return (
		<aside
			className={cn(
				"flex h-full w-72 shrink-0 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear",
			)}
		>
			{/* Top: Run buttons – one line */}
			<div className="flex shrink-0 flex-row gap-2 border-b border-sidebar-border p-3">
				<Button
					variant="outline"
					size="sm"
					className="min-w-0 flex-1 justify-center gap-1.5"
					title="Run selected node"
					disabled={runNodeDisabled}
					onClick={handleRunSelected}
					aria-label="Run selected node"
				>
					{isRunNodeLoading ? (
						<Loader2 className="size-4 shrink-0 animate-spin" />
					) : (
						<Play className="size-4 shrink-0" />
					)}
					Run node
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="min-w-0 flex-1 justify-center gap-1.5"
					title="Trigger whole flow"
					disabled={runFlowDisabled}
					onClick={handleTriggerFlow}
					aria-label="Trigger whole flow"
				>
					{isRunFlowLoading ? (
						<Loader2 className="size-4 shrink-0 animate-spin" />
					) : (
						<Workflow className="size-4 shrink-0" />
					)}
					Run flow
				</Button>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-3">
				<ExecutionHistory workflowId={workflowId} />
			</div>
			{/* Bottom: small collapse sidebar toggle */}
			<div className="shrink-0 border-t border-sidebar-border p-2">
				<Button
					variant="ghost"
					size="icon"
					className="size-7"
					title="Collapse sidebar"
					onClick={onToggleCollapsed}
					aria-label="Collapse sidebar"
				>
					<PanelRightClose className="size-3.5" />
				</Button>
			</div>
		</aside>
	);
}
