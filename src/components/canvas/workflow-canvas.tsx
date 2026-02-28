"use client";

import { useMemo } from "react";
import {
	ReactFlow,
	Controls,
	Background,
	MiniMap,
	BackgroundVariant,
	type NodeTypes,
	type EdgeTypes,
	type Node,
	type Edge,
	type OnNodesChange,
	type OnEdgesChange,
	type OnConnect,
	type ReactFlowProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { BaseNode } from "./nodes";
import { nodeTypes as registryNodeTypes } from "./nodes/registry";
import { WorkflowEdge } from "./edges";
import {
	CanvasBottomIsland,
	type InteractionMode,
} from "./canvas-bottom-island";
import { useNodeClipboardStore } from "@/store";

interface WorkflowCanvasProps extends Omit<
	ReactFlowProps,
	"nodes" | "edges" | "onNodesChange" | "onEdgesChange" | "onConnect"
> {
	nodes: Node[];
	edges: Edge[];
	onNodesChange: OnNodesChange;
	onEdgesChange: OnEdgesChange;
	onConnect: OnConnect;
	/** Extra node types merged with the built-in `base` type */
	extraNodeTypes?: NodeTypes;
	/** Extra edge types merged with the built-in `workflow` type */
	extraEdgeTypes?: EdgeTypes;
	showControls?: boolean;
	showMiniMap?: boolean;
	showBackground?: boolean;
	backgroundVariant?: BackgroundVariant;
	/** When set, the bottom island is shown and default controls are hidden */
	bottomIsland?: {
		interactionMode: InteractionMode;
		onInteractionModeChange: (mode: InteractionMode) => void;
		onUndo: () => void;
		onRedo: () => void;
		canUndo: boolean;
		canRedo: boolean;
	};
	/** When true, nodes/edges cannot be dragged, connected, or selected. */
	readOnly?: boolean;
	className?: string;
}

export function WorkflowCanvas({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
	onConnect,
	extraNodeTypes,
	extraEdgeTypes,
	showControls = true,
	showMiniMap = true,
	showBackground = true,
	backgroundVariant = BackgroundVariant.Dots,
	bottomIsland,
	readOnly = false,
	className,
	...rest
}: WorkflowCanvasProps) {
	const nodeTypes: NodeTypes = useMemo(
		() => ({
			base: BaseNode,
			...registryNodeTypes,
			...extraNodeTypes,
		}),
		[extraNodeTypes],
	);

	const { nodeId: copiedNodeId, setNodeId: setCopiedNodeId } =
		useNodeClipboardStore();

	const edgeTypes: EdgeTypes = useMemo(
		() => ({
			workflow: WorkflowEdge,
			...extraEdgeTypes,
		}),
		[extraEdgeTypes],
	);

	const useBottomIsland = Boolean(bottomIsland);
	const interactionMode = bottomIsland?.interactionMode ?? "select";

	return (
		<div className={cn("h-full w-full", className)}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onCopy={(e) => {
					e.preventDefault();
				}}
				onCopyCapture={(e) => {
					e.preventDefault();
				}}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				defaultEdgeOptions={{ type: "workflow" }}
				fitView
				proOptions={{ hideAttribution: true }}
				nodesDraggable={!readOnly && interactionMode === "select"}
				nodesConnectable={!readOnly}
				elementsSelectable={!readOnly}
				panOnDrag={interactionMode === "pan"}
				panOnScroll
				zoomOnScroll={false}
				zoomOnPinch
				{...rest}
			>
				{showBackground && (
					<Background variant={backgroundVariant} gap={20} size={1} />
				)}
				{!useBottomIsland && showControls && (
					<Controls showInteractive={false} />
				)}
				{useBottomIsland && bottomIsland && (
					<CanvasBottomIsland
						interactionMode={bottomIsland.interactionMode}
						onInteractionModeChange={
							bottomIsland.onInteractionModeChange
						}
						onUndo={bottomIsland.onUndo}
						onRedo={bottomIsland.onRedo}
						canUndo={bottomIsland.canUndo}
						canRedo={bottomIsland.canRedo}
					/>
				)}
				{showMiniMap && (
					<MiniMap
						pannable
						zoomable
						maskStrokeColor="none"
						nodeColor={(node: Node) => {
							const t = node.type as string | undefined;
							const colors: Record<string, string> = {
								TEXT: "#a78bfa",
								IMAGE_UPLOAD: "#34d399",
								VIDEO_UPLOAD: "#f472b6",
								RUN_LLM: "#fbbf24",
								CROP_IMAGE: "#60a5fa",
								EXTRACT_VIDEO_FRAME: "#c084fc",
								EXTRACT_VIDEO: "#fb923c",
							};
							return colors[t ?? ""] ?? "#94a3b8";
						}}
						nodeStrokeColor="#1e293b"
						nodeBorderRadius={6}
						maskColor="rgba(15, 23, 42, 0.75)"
					/>
				)}
			</ReactFlow>
		</div>
	);
}
