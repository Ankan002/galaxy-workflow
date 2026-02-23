"use client";

import {
	BaseEdge as XYBaseEdge,
	EdgeLabelRenderer,
	getBezierPath,
	type EdgeProps,
} from "@xyflow/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

export interface BaseEdgeData extends Record<string, unknown> {
	label?: string;
	variant?: "default" | "prompt" | "image";
	animated?: boolean;
	onDelete?: (id: string) => void;
}

const variantStroke: Record<
	NonNullable<BaseEdgeData["variant"]>,
	string
> = {
	default: "var(--muted-foreground)",
	prompt: "var(--connection-prompt)",
	image: "var(--connection-image)",
};

export function WorkflowEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	selected,
	data,
	markerEnd,
}: EdgeProps) {
	const {
		label,
		variant = "default",
		animated = false,
		onDelete,
	} = (data ?? {}) as BaseEdgeData;

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const stroke = selected ? "var(--primary)" : variantStroke[variant];

	return (
		<>
			<XYBaseEdge
				id={id}
				path={edgePath}
				markerEnd={markerEnd}
				style={{
					stroke,
					strokeWidth: selected ? 2.5 : 2,
					transition: "stroke 150ms ease, stroke-width 150ms ease",
				}}
				className={cn(animated && "animated")}
			/>

			{(label || (selected && onDelete)) && (
				<EdgeLabelRenderer>
					<div
						className="nodrag nopan pointer-events-auto absolute flex items-center gap-1"
						style={{
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
						}}
					>
						{label && (
							<span className="rounded-md bg-card border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
								{label}
							</span>
						)}
						{selected && onDelete && (
							<Button
								variant="ghost"
								size="icon-sm"
								className="size-5 rounded-full bg-card border border-border hover:bg-destructive hover:text-destructive-foreground"
								onClick={() => onDelete(id)}
							>
								<X className="size-3" />
							</Button>
						)}
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}
