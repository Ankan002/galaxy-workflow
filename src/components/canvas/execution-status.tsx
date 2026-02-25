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

	const variant = isCompleted
		? "success"
		: isFailed
			? "destructive"
			: isRunning
				? "brand"
				: "secondary";

	return (
		<Badge
			variant={variant}
			className={cn(
				"gap-1 font-normal",
				className,
			)}
		>
			{showIcon && (
				<>
					{isCompleted && (
						<CheckCircle2 className="size-3 shrink-0" />
					)}
					{isFailed && <XCircle className="size-3 shrink-0" />}
					{isRunning && (
						<Loader2 className="size-3 shrink-0 animate-spin" />
					)}
					{isPending && (
						<Circle className="size-3 shrink-0" />
					)}
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
				className="size-4 shrink-0 text-green-600 dark:text-green-500"
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
				className="size-4 shrink-0 animate-spin text-muted-foreground"
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
