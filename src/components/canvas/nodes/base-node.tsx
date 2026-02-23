"use client";

import { type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Card, Badge } from "@/components/ui";
import type {
	BaseNodeProps,
	NodeStatus,
	InputHandleDef,
	OutputHandleDef,
} from "./registry/types";

/** Legacy shape for nodes that use "base" type (e.g. canvas-demo) */
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
	status?: NodeStatus | "success" | "error";
	sourceHandles?: Array<{ id: string; position?: Position; style?: React.CSSProperties }>;
	targetHandles?: Array<{ id: string; position?: Position; style?: React.CSSProperties }>;
}

const statusToNodeStatus = (s: BaseNodeData["status"]): NodeStatus | undefined => {
	if (s === "success") return "completed";
	if (s === "error") return "failed";
	return s as NodeStatus | undefined;
};

const statusBadgeClasses: Record<NodeStatus, string> = {
	idle: "bg-muted-foreground",
	running: "bg-yambo-blue animate-pulse",
	completed: "bg-yambo-green",
	failed: "bg-destructive",
};

function isNodeProps(
	props: BaseNodeProps | NodeProps,
): props is NodeProps & { data: BaseNodeData } {
	return "data" in props && props.data != null;
}

function legacyDataToBaseNodeProps(
	data: BaseNodeData,
	selected: boolean,
): BaseNodeProps {
	const targetHandles = data.targetHandles ?? [{ id: "target", position: Position.Top }];
	const sourceHandles = data.sourceHandles ?? [{ id: "source", position: Position.Bottom }];
	return {
		label: data.label,
		description: data.description,
		status: statusToNodeStatus(data.status),
		selected,
		icon: data.icon,
		badge: data.badge,
		badgeVariant: data.badgeVariant,
		inputHandles: targetHandles.map((h) => ({
			key: h.id,
			type: "any" as const,
			required: false,
		})),
		outputHandles: sourceHandles.map((h) => ({ key: h.id, type: "any" as const })),
	};
}

function renderHandles(
	inputHandles: InputHandleDef[],
	outputHandles: OutputHandleDef[],
) {
	const inputCount = inputHandles.length;
	const outputCount = outputHandles.length;
	return (
		<>
			{inputHandles.map((h, i) => (
				<Handle
					key={h.key}
					type="target"
					id={h.key}
					position={Position.Left}
					className="!w-2.5 !h-2.5 !border-2 !bg-background"
					style={
						inputCount > 1
							? { top: `${((i + 1) / (inputCount + 1)) * 100}%`, left: 0 }
							: undefined
					}
				/>
			))}
			{outputHandles.map((h, i) => (
				<Handle
					key={h.key}
					type="source"
					id={h.key}
					position={Position.Right}
					className="!w-2.5 !h-2.5 !border-2 !bg-background"
					style={
						outputCount > 1
							? { top: `${((i + 1) / (outputCount + 1)) * 100}%`, right: 0 }
							: undefined
					}
				/>
			))}
		</>
	);
}

/** Reusable base node: title, dynamic input/output handles, status badge. Used by registry nodes or legacy "base" type. */
export function BaseNode(props: BaseNodeProps | NodeProps) {
	const resolved: BaseNodeProps = isNodeProps(props)
		? legacyDataToBaseNodeProps(props.data as BaseNodeData, props.selected ?? false)
		: (props as BaseNodeProps);

	const {
		label,
		description,
		status,
		inputHandles,
		outputHandles,
		selected = false,
		children,
		icon,
		badge,
		badgeVariant = "secondary",
	} = resolved;

	return (
		<>
			{renderHandles(inputHandles, outputHandles)}
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
										statusBadgeClasses[status],
									)}
									title={status}
								/>
							)}
							<span className="text-sm font-medium text-foreground truncate">
								{label}
							</span>
						</div>
						{description && (
							<span className="text-xs text-muted-foreground truncate block">
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
				{children && (
					<div className="px-3.5 pb-2.5 pt-0 border-t border-border/50">
						{children}
					</div>
				)}
			</Card>
		</>
	);
}
