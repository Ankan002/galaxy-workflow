"use client";

import React, { type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import {
	Card,
	Badge,
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuGroup,
	ContextMenuSeparator,
} from "@/components/ui";
import type {
	BaseNodeProps,
	NodeStatus,
	InputHandleDef,
	OutputHandleDef,
} from "./registry/types";
import type { HandleDataType } from "./registry/types";
import { Copy, Trash2 } from "lucide-react";
import { useWorkflowNodePersistence } from "@/components/canvas/workflow-node-persistence-context";

/** Legacy shape for nodes that use "base" type (e.g. canvas-demo) */
export interface BaseNodeData extends Record<string, unknown> {
	/** The node's ID on the server */
	id?: string;
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
	isPulsating?: boolean;
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
	onDuplicate?: (id: string) => Promise<void>;
}

const statusToNodeStatus = (
	s: BaseNodeData["status"],
): NodeStatus | undefined => {
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
	const targetHandles = data.targetHandles ?? [
		{ id: "target", position: Position.Top },
	];
	const sourceHandles = data.sourceHandles ?? [
		{ id: "source", position: Position.Bottom },
	];
	return {
		id: data.id,
		label: data.label,
		description: data.description,
		status: statusToNodeStatus(data.status),
		selected,
		icon: data.icon,
		badge: data.badge,
		badgeVariant: data.badgeVariant,
		isPulsating: !!data.isPulsating,
		inputHandles: targetHandles.map((h) => ({
			key: h.id,
			type: "any" as const,
			required: false,
		})),
		outputHandles: sourceHandles.map((h) => ({
			key: h.id,
			type: "any" as const,
		})),
	};
}

const handleTypeBorderBg: Record<
	HandleDataType,
	{ border: string; bg: string; label: string }
> = {
	string: {
		border: "!border-connection-prompt",
		bg: "!bg-connection-prompt/30",
		label: "text-connection-prompt",
	},
	number: {
		border: "!border-chart-3",
		bg: "!bg-chart-3/30",
		label: "text-chart-3",
	},
	boolean: {
		border: "!border-chart-2",
		bg: "!bg-chart-2/30",
		label: "text-chart-2",
	},
	json: {
		border: "!border-chart-4",
		bg: "!bg-chart-4/30",
		label: "text-chart-4",
	},
	image: {
		border: "!border-connection-image",
		bg: "!bg-connection-image/30",
		label: "text-connection-image",
	},
	video: {
		border: "!border-primary",
		bg: "!bg-primary/30",
		label: "text-primary",
	},
	file: {
		border: "!border-chart-5",
		bg: "!bg-chart-5/30",
		label: "text-chart-5",
	},
	any: {
		border: "!border-muted-foreground",
		bg: "!bg-muted-foreground/20",
		label: "text-muted-foreground",
	},
};

function getHandleStyle(type: HandleDataType) {
	return handleTypeBorderBg[type] ?? handleTypeBorderBg.any;
}

function renderHandles(
	inputHandles: InputHandleDef[],
	outputHandles: OutputHandleDef[],
) {
	const inputCount = inputHandles.length;
	const outputCount = outputHandles.length;
	const inputTop = (i: number) =>
		inputCount > 1
			? { top: `${((i + 1) / (inputCount + 1)) * 100}%`, left: 0 }
			: undefined;
	const outputTop = (i: number) =>
		outputCount > 1
			? { top: `${((i + 1) / (outputCount + 1)) * 100}%`, right: 0 }
			: undefined;

	return (
		<>
			{inputHandles.map((h, i) => {
				const style = getHandleStyle(h.type);
				return (
					<React.Fragment key={h.key}>
						<Handle
							type="target"
							id={h.key}
							position={Position.Left}
							className={cn(
								"!w-2.5 !h-2.5 !border-2 !bg-background",
								style.border,
								style.bg,
							)}
							style={inputTop(i)}
						/>
						<span
							className={cn(
								"absolute z-10 text-[10px] font-medium opacity-90 max-w-[72px] truncate pointer-events-none whitespace-nowrap",
								style.label,
							)}
							style={
								inputCount > 1
									? {
											top: `${((i + 1) / (inputCount + 1)) * 100}%`,
											right: "100%",
											marginRight: 6,
											transform: "translateY(-50%)",
										}
									: {
											top: "50%",
											right: "100%",
											marginRight: 6,
											transform: "translateY(-50%)",
										}
							}
						>
							{h.key}
						</span>
					</React.Fragment>
				);
			})}
			{outputHandles.map((h, i) => {
				const style = getHandleStyle(h.type);
				return (
					<React.Fragment key={h.key}>
						<Handle
							type="source"
							id={h.key}
							position={Position.Right}
							className={cn(
								"!w-2.5 !h-2.5 !border-2 !bg-background",
								style.border,
								style.bg,
							)}
							style={outputTop(i)}
						/>
						<span
							className={cn(
								"absolute z-10 max-w-[72px] truncate text-right text-[10px] font-medium opacity-90 pointer-events-none whitespace-nowrap",
								style.label,
							)}
							style={
								outputCount > 1
									? {
											top: `${((i + 1) / (outputCount + 1)) * 100}%`,
											left: "100%",
											marginLeft: 6,
											transform: "translateY(-50%)",
										}
									: {
											top: "50%",
											left: "100%",
											marginLeft: 6,
											transform: "translateY(-50%)",
										}
							}
						>
							{h.key}
						</span>
					</React.Fragment>
				);
			})}
		</>
	);
}

/** Reusable base node: title, dynamic input/output handles, status badge. Used by registry nodes or legacy "base" type. */
export function BaseNode(props: BaseNodeProps | NodeProps) {
	const { onDuplicate } = useWorkflowNodePersistence();
	const resolved: BaseNodeProps = isNodeProps(props)
		? legacyDataToBaseNodeProps(
				props.data as BaseNodeData,
				props.selected ?? false,
			)
		: (props as BaseNodeProps);

	const {
		id,
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
		isPulsating = false,
	} = resolved;

	return (
		<>
			{renderHandles(inputHandles, outputHandles)}
			<ContextMenu>
				<ContextMenuTrigger>
					<Card
						variant={selected ? "selected" : "node"}
						padding="none"
						data-node-id={id}
						className={cn(
							"min-w-[200px] max-w-[280px] transition-shadow",
							selected && "shadow-lg",
							isPulsating && "node-pulse",
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
				</ContextMenuTrigger>
				<ContextMenuContent className="w-56">
					<ContextMenuGroup>
						<ContextMenuItem onClick={() => id && onDuplicate(id)}>
							<Copy /> Duplicate
						</ContextMenuItem>
					</ContextMenuGroup>
					<ContextMenuSeparator />
					<ContextMenuGroup>
						<ContextMenuItem className="text-destructive hover:bg-destructive/40 hover:text-destructive">
							<Trash2 /> Delete
						</ContextMenuItem>
					</ContextMenuGroup>
				</ContextMenuContent>
			</ContextMenu>
		</>
	);
}
