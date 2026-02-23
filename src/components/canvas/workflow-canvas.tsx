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

interface WorkflowCanvasProps
	extends Omit<
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

	const edgeTypes: EdgeTypes = useMemo(
		() => ({
			workflow: WorkflowEdge,
			...extraEdgeTypes,
		}),
		[extraEdgeTypes],
	);

	return (
		<div className={cn("h-full w-full", className)}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				defaultEdgeOptions={{ type: "workflow" }}
				fitView
				proOptions={{ hideAttribution: true }}
				{...rest}
			>
				{showBackground && (
					<Background variant={backgroundVariant} gap={20} size={1} />
				)}
				{showControls && <Controls showInteractive={false} />}
				{showMiniMap && (
					<MiniMap
						pannable
						zoomable
						maskStrokeColor="none"
					/>
				)}
			</ReactFlow>
		</div>
	);
}
