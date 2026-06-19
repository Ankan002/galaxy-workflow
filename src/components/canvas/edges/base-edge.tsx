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
	variant?:
		| "default"
		| "prompt"
		| "image"
		| "video"
		| "number"
		| "json"
		| "file";
	animated?: boolean;
	onDelete?: (id: string) => void;
}

const variantStroke: Record<
	NonNullable<BaseEdgeData["variant"]>,
	string
> = {
	default: "var(--muted-foreground)",
	prompt: "var(--data-string)",
	image: "var(--data-image)",
	video: "var(--data-video)",
	number: "var(--data-number)",
	json: "var(--data-json)",
	file: "var(--data-file)",
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
	const strokeWidth = selected ? 2.5 : 2;

	return (
		<>
			<g>
				<XYBaseEdge
					id={id}
					path={edgePath}
					markerEnd={markerEnd}
					style={{
						stroke,
						strokeWidth,
						transition: "stroke 150ms ease",
					}}
					className={cn(animated && "animated")}
				/>
				{/* Sparkle glow: soft halo behind the bright dash */}
				<path
					d={edgePath}
					fill="none"
					stroke={stroke}
					strokeWidth={6}
					strokeLinecap="round"
					strokeDasharray="26 74"
					pathLength={100}
					opacity={0.4}
					style={{
						pointerEvents: "none",
						animation: "edge-march 1.4s linear infinite",
					}}
				/>
				{/* Sparkle: bright dash travels source → target, same color as edge */}
				<path
					d={edgePath}
					fill="none"
					stroke={stroke}
					strokeWidth={Math.max(3.5, strokeWidth + 1.5)}
					strokeLinecap="round"
					strokeDasharray="26 74"
					pathLength={100}
					style={{
						pointerEvents: "none",
						animation: "edge-march 1.4s linear infinite",
					}}
				/>
			</g>

			{(label || (selected && onDelete)) && (
				<EdgeLabelRenderer>
					<div
						className="nodrag nopan pointer-events-auto absolute flex items-center gap-1"
						style={{
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
						}}
					>
						{label && (
							<span className="rounded-sm bg-card border-2 border-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground shadow-xs">
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
