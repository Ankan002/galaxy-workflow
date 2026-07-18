"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/** Execution status values used by workflow_execution and node_execution */
export const EXECUTION_STATUS = {
	PENDING: "pending",
	RUNNING: "running",
	COMPLETED: "completed",
	FAILED: "failed",
} as const;

export type ExecutionStatusValue =
	(typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

const STATUS_LABEL: Record<string, string> = {
	[EXECUTION_STATUS.PENDING]: "Pending",
	[EXECUTION_STATUS.RUNNING]: "Running",
	[EXECUTION_STATUS.COMPLETED]: "Completed",
	[EXECUTION_STATUS.FAILED]: "Failed",
};

export function getExecutionStatusLabel(status: string): string {
	return STATUS_LABEL[status] ?? status;
}

export interface ExecutionStatusBadgeProps {
	status: string;
	className?: string;
	showIcon?: boolean;
}

/** Badge for workflow or node execution status (pending, running, completed, failed). */
export function ExecutionStatusBadge({
	status,
	className,
	showIcon = true,
}: ExecutionStatusBadgeProps) {
	const s = status as ExecutionStatusValue;
	const isPending = s === EXECUTION_STATUS.PENDING;
	const isRunning = s === EXECUTION_STATUS.RUNNING;
	const isCompleted = s === EXECUTION_STATUS.COMPLETED;
	const isFailed = s === EXECUTION_STATUS.FAILED;

	// Running is the one loud state — the live moment you're watching. Finished
	// states recede into quiet tints. Text stays ink/foreground so contrast
	// always clears AA; the icon carries the hue, so colour is never the sole
	// signal (label + icon both present).
	const tone = isRunning
		? "border-transparent bg-status-running text-[var(--ak-ink)]"
		: isCompleted
			? "border-status-completed/30 bg-status-completed/12 text-foreground"
			: isFailed
				? "border-destructive/30 bg-destructive/12 text-foreground"
				: "border-border bg-muted text-muted-foreground";

	return (
		<Badge
			variant="outline"
			className={cn("gap-1 font-medium", tone, className)}
		>
			{showIcon && (
				<>
					{isCompleted && (
						<CheckCircle2 className="size-3 shrink-0 text-status-completed" />
					)}
					{isFailed && (
						<XCircle className="size-3 shrink-0 text-destructive" />
					)}
					{isRunning && (
						<Loader2 className="size-3 shrink-0 animate-spin text-[var(--ak-ink)]" />
					)}
					{isPending && <Circle className="size-3 shrink-0" />}
				</>
			)}
			{getExecutionStatusLabel(status)}
		</Badge>
	);
}

/** Compact status icon only (for node rows). */
export function ExecutionStatusIcon({ status }: { status: string }) {
	const s = status as ExecutionStatusValue;
	if (s === EXECUTION_STATUS.COMPLETED) {
		return (
			<CheckCircle2
				className="size-4 shrink-0 text-status-completed"
				aria-label="Completed"
			/>
		);
	}
	if (s === EXECUTION_STATUS.FAILED) {
		return (
			<XCircle
				className="size-4 shrink-0 text-destructive"
				aria-label="Failed"
			/>
		);
	}
	if (s === EXECUTION_STATUS.RUNNING) {
		return (
			<Loader2
				className="size-4 shrink-0 animate-spin text-status-running"
				aria-label="Running"
			/>
		);
	}
	return (
		<Circle
			className="size-4 shrink-0 text-muted-foreground"
			aria-label="Pending"
		/>
	);
}
