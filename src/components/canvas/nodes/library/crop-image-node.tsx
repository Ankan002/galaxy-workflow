"use client";

import { useCallback, useMemo } from "react";
import { useReactFlow, useEdges, useStore, type NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useWorkflowNodePersistence } from "@/components/canvas/workflow-node-persistence-context";

export interface CropImageNodeConfig {
	x_percent?: number;
	y_percent?: number;
	width_percent?: number;
	height_percent?: number;
}

const CROP_PERCENT_HANDLES = [
	{ key: "x_percent", type: "string" as const, required: false },
	{ key: "y_percent", type: "string" as const, required: false },
	{ key: "width_percent", type: "string" as const, required: false },
	{ key: "height_percent", type: "string" as const, required: false },
];

export const CROP_IMAGE_DEFINITION: Omit<NodeDefinition<CropImageNodeConfig>, "Component"> = {
	type: NodeType.CROP_IMAGE,
	label: "Crop Image",
	description: "Crop an image by percentage region (jpg, jpeg, png, webp, gif)",
	provider: "TRANSLOADIT",
	inputHandles: [
		{ key: "image_url", type: "image", required: true },
		...CROP_PERCENT_HANDLES,
	],
	outputHandles: [{ key: "image", type: "image" }],
	defaultConfig: {
		x_percent: 0,
		y_percent: 0,
		width_percent: 100,
		height_percent: 100,
	},
};

const PERCENT_HANDLE_KEYS = ["x_percent", "y_percent", "width_percent", "height_percent"] as const;

function useConnectedPercentHandles(nodeId: string): Set<string> {
	const edges = useEdges();
	return useMemo(() => {
		const set = new Set<string>();
		for (const e of edges) {
			if (e.target === nodeId && e.targetHandle && PERCENT_HANDLE_KEYS.includes(e.targetHandle as (typeof PERCENT_HANDLE_KEYS)[number])) {
				set.add(e.targetHandle);
			}
		}
		return set;
	}, [edges, nodeId]);
}

/** Subscribe to connected source nodes' config so this node re-renders when they change (e.g. text node value). */
function useConnectedSourceConfigDeps(nodeId: string): string {
	return useStore((state) => {
		const edges = state.edges ?? [];
		const nodes = state.nodes ?? [];
		const sourceIds = new Set(
			edges
				.filter(
					(e: { target: string; targetHandle?: string | null }) =>
						e.target === nodeId &&
						e.targetHandle &&
						PERCENT_HANDLE_KEYS.includes(e.targetHandle as (typeof PERCENT_HANDLE_KEYS)[number]),
				)
				.map((e: { source: string }) => e.source),
		);
		return nodes
			.filter((n: { id: string }) => sourceIds.has(n.id))
			.map((n: { data?: { config?: unknown } }) =>
				n.data?.config == null ? "" : JSON.stringify(n.data.config),
			)
			.join("|");
	});
}

/** For each percent handle, get the value from the connected source node (e.g. text node) for display. */
function useLoadedValuesFromConnections(nodeId: string): Record<string, string | number> {
	const edges = useEdges();
	const { getNode } = useReactFlow();
	// Subscribe to store so we re-render when connected source node data changes (e.g. text node value)
	const sourceConfigDeps = useConnectedSourceConfigDeps(nodeId);
	const connectedEdges = useMemo(
		() =>
			edges.filter(
				(e) =>
					e.target === nodeId &&
					e.targetHandle &&
					PERCENT_HANDLE_KEYS.includes(e.targetHandle as (typeof PERCENT_HANDLE_KEYS)[number]),
			),
		[edges, nodeId],
	);
	return useMemo(() => {
		const out: Record<string, string | number> = {};
		for (const e of connectedEdges) {
			const sourceNode = getNode(e.source);
			if (!sourceNode?.data?.config || !e.targetHandle) continue;
			const config = sourceNode.data.config as Record<string, unknown>;
			const raw = config.value ?? config.text ?? config.output;
			if (raw !== undefined && raw !== null) {
				const s = typeof raw === "string" ? raw : String(raw);
				const n = Number(s);
				out[e.targetHandle] = Number.isFinite(n) ? n : s;
			}
		}
		return out;
	}, [connectedEdges, getNode, sourceConfigDeps]);
}

export function CropImageNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const { onNodeDetailsBlur } = useWorkflowNodePersistence();
	const connectedPercentHandles = useConnectedPercentHandles(id);
	const loadedValues = useLoadedValuesFromConnections(id);
	const config = (data?.config ?? CROP_IMAGE_DEFINITION.defaultConfig) as CropImageNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	// When a handle is connected, show the value loaded from that connection (e.g. text node); otherwise config/default
	const x = loadedValues["x_percent"] ?? config.x_percent ?? 0;
	const y = loadedValues["y_percent"] ?? config.y_percent ?? 0;
	const w = loadedValues["width_percent"] ?? config.width_percent ?? 100;
	const h = loadedValues["height_percent"] ?? config.height_percent ?? 100;

	const handleBlur = useCallback(
		(e: React.FocusEvent) => {
			if (e.relatedTarget != null && e.currentTarget.contains(e.relatedTarget as HTMLElement)) return;
			const node = getNode(id);
			if (!node) return;
			onNodeDetailsBlur(id, {
				config: (node.data?.config as Record<string, unknown>) ?? {},
				positionX: node.position.x,
				positionY: node.position.y,
			});
		},
		[id, getNode, onNodeDetailsBlur],
	);

	return (
		<BaseNode
			label={CROP_IMAGE_DEFINITION.label}
			description={CROP_IMAGE_DEFINITION.description}
			status={status}
			inputHandles={CROP_IMAGE_DEFINITION.inputHandles}
			outputHandles={CROP_IMAGE_DEFINITION.outputHandles}
			selected={selected}
			isPulsating={data?.isPulsating}
		>
			<div className="space-y-2 nodrag nopan" onBlur={handleBlur}>
				<p className="text-[10px] text-muted-foreground">
					X, Y, width and height are set only by connected inputs.
				</p>
				<div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
					<div className="flex items-baseline justify-between gap-2">
						<span className="text-muted-foreground">X %</span>
						<span className="font-mono tabular-nums">
							{x}
							{connectedPercentHandles.has("x_percent") && (
								<span className="ml-1 text-chart-3">(connected)</span>
							)}
						</span>
					</div>
					<div className="flex items-baseline justify-between gap-2">
						<span className="text-muted-foreground">Y %</span>
						<span className="font-mono tabular-nums">
							{y}
							{connectedPercentHandles.has("y_percent") && (
								<span className="ml-1 text-chart-3">(connected)</span>
							)}
						</span>
					</div>
					<div className="flex items-baseline justify-between gap-2">
						<span className="text-muted-foreground">Width %</span>
						<span className="font-mono tabular-nums">
							{w}
							{connectedPercentHandles.has("width_percent") && (
								<span className="ml-1 text-chart-3">(connected)</span>
							)}
						</span>
					</div>
					<div className="flex items-baseline justify-between gap-2">
						<span className="text-muted-foreground">Height %</span>
						<span className="font-mono tabular-nums">
							{h}
							{connectedPercentHandles.has("height_percent") && (
								<span className="ml-1 text-chart-3">(connected)</span>
							)}
						</span>
					</div>
				</div>
				<p className="text-[10px] text-muted-foreground opacity-80">
					Output: image (URL)
				</p>
			</div>
		</BaseNode>
	);
}
