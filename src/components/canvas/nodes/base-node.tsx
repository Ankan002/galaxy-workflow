"use client";

import { type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Card, Badge } from "@/components/ui";

export interface BaseNodeData extends Record<string, unknown> {
	label: string;
	description?: string;
	icon?: ReactNode;
	badge?: string;
	badgeVariant?:
		| "default"
		| "secondary"
		| "destructive"
		| "outline"
		| "connection-prompt"
		| "connection-image"
		| "success";
	status?: "idle" | "running" | "success" | "error";
	sourceHandles?: Array<{
		id: string;
		position?: Position;
		style?: React.CSSProperties;
	}>;
	targetHandles?: Array<{
		id: string;
		position?: Position;
		style?: React.CSSProperties;
	}>;
}

const statusIndicatorClasses: Record<
	NonNullable<BaseNodeData["status"]>,
	string
> = {
	idle: "bg-muted-foreground",
	running: "bg-yambo-blue animate-pulse",
	success: "bg-yambo-green",
	error: "bg-destructive",
};

export function BaseNode({ data, selected }: NodeProps) {
	const {
		label,
		description,
		icon,
		badge,
		badgeVariant = "secondary",
		status,
		sourceHandles,
		targetHandles,
	} = data as BaseNodeData;

	const defaultTargetHandles = targetHandles ?? [
		{ id: "target", position: Position.Top },
	];
	const defaultSourceHandles = sourceHandles ?? [
		{ id: "source", position: Position.Bottom },
	];

	return (
		<>
			{defaultTargetHandles.map((h) => (
				<Handle
					key={h.id}
					type="target"
					id={h.id}
					position={h.position ?? Position.Top}
					style={h.style}
				/>
			))}

			<Card
				variant={selected ? "selected" : "node"}
				padding="none"
				className={cn(
					"min-w-[200px] max-w-[280px] transition-shadow",
					selected && "shadow-lg",
				)}
			>
				<div className="flex items-center gap-2.5 px-3.5 py-2.5">
					{icon && (
						<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-foreground">
							{icon}
						</div>
					)}

					<div className="flex flex-col gap-0.5 min-w-0 flex-1">
						<div className="flex items-center gap-2">
							{status && (
								<span
									className={cn(
										"size-2 rounded-full shrink-0",
										statusIndicatorClasses[status],
									)}
								/>
							)}
							<span className="text-sm font-medium text-foreground truncate">
								{label}
							</span>
						</div>
						{description && (
							<span className="text-xs text-muted-foreground truncate">
								{description}
							</span>
						)}
					</div>

					{badge && (
						<Badge
							variant={badgeVariant}
							className="shrink-0 text-[10px] px-1.5 py-0"
						>
							{badge}
						</Badge>
					)}
				</div>
			</Card>

			{defaultSourceHandles.map((h) => (
				<Handle
					key={h.id}
					type="source"
					id={h.id}
					position={h.position ?? Position.Bottom}
					style={h.style}
				/>
			))}
		</>
	);
}
