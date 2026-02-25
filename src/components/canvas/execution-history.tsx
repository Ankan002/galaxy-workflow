"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Circle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	useGetWorkflowExecutions,
	useGetWorkflowExecution,
	type WorkflowExecutionListItem,
	type NodeExecutionWithNode,
	type WorkflowExecutionWithNodes,
} from "@/services/client-api/workflow-executions";

const NODE_TYPE_LABEL: Record<string, string> = {
	run_llm: "LLM Node",
	crop_image: "Crop Image",
	extract_video_frame: "Extract Video Frame",
	text: "Text",
	image_upload: "Image Upload",
	video_upload: "Video Upload",
};

function formatRunDate(createdAt: string): string {
	const d = new Date(createdAt);
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function formatDuration(createdAt: string, updatedAt: string): string {
	const ms =
		new Date(updatedAt).getTime() - new Date(createdAt).getTime();
	const s = ms / 1000;
	if (s < 1) return `${Math.round(ms)}ms`;
	return `${s.toFixed(1)}s`;
}

function outputPreview(output: unknown): string {
	if (output == null) return "";
	if (typeof output === "string") return output;
	if (typeof output === "object" && output !== null) {
		const o = output as Record<string, unknown>;
		if (typeof o.text === "string") return o.text;
		if (typeof o.output === "string") return o.output;
		if (typeof o.uploaded_url === "string") return o.uploaded_url;
		if (typeof o.url === "string") return o.url;
		if (typeof o.image === "string") return o.image;
		return JSON.stringify(output);
	}
	return String(output);
}

function errorPreview(error: unknown): string {
	if (error == null) return "";
	if (typeof error === "string") return error;
	return JSON.stringify(error);
}

export interface ExecutionHistoryProps {
	workflowId: string;
}

export function ExecutionHistory({ workflowId }: ExecutionHistoryProps) {
	const [selectedExecutionId, setSelectedExecutionId] = useState<
		string | null
	>(null);

	const { data: executions, isLoading: isLoadingList } =
		useGetWorkflowExecutions({
			workflowId,
			execution_type: "one_node",
			limit: 50,
		});

	const { data: selectedExecution, isLoading: isLoadingDetail } =
		useGetWorkflowExecution({
			workflowId,
			executionId: selectedExecutionId,
		});

	const runList = useMemo(
		() => (executions ?? []).slice(0, 50),
		[executions],
	);

	const handleSelectRun = useCallback((id: string) => {
		setSelectedExecutionId((prev) => (prev === id ? null : id));
	}, []);

	if (!workflowId) return null;

	return (
		<div className="flex h-full min-h-0 flex-col gap-2">
			<h3 className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Execution history
			</h3>
			{/* Run list */}
			<div className="shrink-0 space-y-1">
				{isLoadingList ? (
					<div className="flex items-center gap-2 py-2 text-muted-foreground">
						<Loader2 className="size-3.5 animate-spin" />
						<span className="text-xs">Loading runs…</span>
					</div>
				) : runList.length === 0 ? (
					<p className="text-xs text-muted-foreground">
						No single-node runs yet. Run a node to see history.
					</p>
				) : (
					<ul className="space-y-0.5">
						{runList.map((run, index) => (
							<RunListItem
								key={run.id}
								run={run}
								runNumber={runList.length - index}
								isSelected={selectedExecutionId === run.id}
								onSelect={() => handleSelectRun(run.id)}
							/>
						))}
					</ul>
				)}
			</div>
			{/* Selected run detail: nodes with output/error */}
			<div className="min-h-0 flex-1 overflow-auto rounded-md border border-sidebar-border bg-muted/30">
				{!selectedExecutionId ? (
					<div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
						Select a run to see node output and errors
					</div>
				) : isLoadingDetail ? (
					<div className="flex h-full items-center justify-center gap-2 p-4 text-muted-foreground">
						<Loader2 className="size-4 animate-spin" />
						<span className="text-xs">Loading run…</span>
					</div>
				) : selectedExecution ? (
					<RunDetail execution={selectedExecution} />
				) : null}
			</div>
		</div>
	);
}

function RunListItem({
	run,
	runNumber,
	isSelected,
	onSelect,
}: {
	run: WorkflowExecutionListItem;
	runNumber: number;
	isSelected: boolean;
	onSelect: () => void;
}) {
	return (
		<li>
			<button
				type="button"
				onClick={onSelect}
				className={cn(
					"w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-sidebar-accent",
					isSelected && "bg-sidebar-accent font-medium",
				)}
			>
				<span className="text-foreground">
					Run #{runNumber}
				</span>
				<span className="block truncate text-muted-foreground">
					{formatRunDate(run.created_at)} (Single Node)
				</span>
			</button>
		</li>
	);
}

function RunDetail({
	execution,
}: {
	execution: WorkflowExecutionWithNodes;
}) {
	return (
		<div className="p-3">
			<div className="mb-2 text-xs font-medium text-muted-foreground">
				Run – {formatRunDate(execution.created_at)} (
				{execution.execution_type === "one_node"
					? "Single Node"
					: "Full"}
				)
			</div>
			<ul className="space-y-3">
				{execution.node_executions.map((ne) => (
					<NodeExecutionItem key={ne.id} nodeExecution={ne} />
				))}
			</ul>
		</div>
	);
}

function NodeExecutionItem({
	nodeExecution,
}: {
	nodeExecution: NodeExecutionWithNode;
}) {
	const label =
		NODE_TYPE_LABEL[nodeExecution.node.type] ?? nodeExecution.node.type;
	const status = nodeExecution.status as string;
	const isSuccess = status === "completed";
	const isFailed = status === "failed";
	const isPending = status === "pending" || status === "running";

	const duration =
		status === "completed" || status === "failed"
			? formatDuration(
					nodeExecution.created_at,
					nodeExecution.updated_at,
				)
			: null;

	const outputStr = outputPreview(nodeExecution.output);
	const errorStr = errorPreview(nodeExecution.error);

	return (
		<li className="flex flex-col gap-0.5">
			{/* Node name + status + duration */}
			<div className="flex items-center gap-2">
				<span className="flex shrink-0 items-center gap-1.5">
					{isSuccess && (
						<CheckCircle2 className="size-4 text-green-600 dark:text-green-500" />
					)}
					{isFailed && (
						<XCircle className="size-4 text-destructive" />
					)}
					{isPending && (
						<Circle className="size-4 text-muted-foreground" />
					)}
					<span className="text-xs font-medium">
						{label} ({nodeExecution.node_id.slice(0, 8)}…)
					</span>
				</span>
				{duration != null && (
					<span className="ml-auto shrink-0 text-xs text-muted-foreground">
						{duration}
					</span>
				)}
			</div>
			{/* Output / Error – indented */}
			{(outputStr || errorStr) && (
				<div className="border-l-2 border-sidebar-border pl-3 text-xs text-muted-foreground">
					{errorStr ? (
						<p className="text-destructive">
							Error: {errorStr}
						</p>
					) : (
						<p className="break-all">
							Output: {outputStr.length > 120 ? `${outputStr.slice(0, 120)}…` : outputStr}
						</p>
					)}
				</div>
			)}
		</li>
	);
}
