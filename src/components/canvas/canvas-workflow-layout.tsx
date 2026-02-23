"use client";

import { useCallback, useRef, useState } from "react";
import { ReactFlowProvider, type Node, type ReactFlowInstance } from "@xyflow/react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowCanvas } from "./workflow-canvas";
import { CanvasNodeSidebar } from "./canvas-node-sidebar";
import { NODE_REGISTRY, NodeType } from "./nodes/registry";
import type { InteractionMode } from "./canvas-bottom-island";

const DRAG_TYPE = "application/reactflow";

function generateNodeId(): string {
	return `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface CanvasWorkflowLayoutProps {
	nodes: Node[];
	edges: ReturnType<typeof import("@xyflow/react").useEdgesState>[0];
	onNodesChange: ReturnType<typeof import("@xyflow/react").useNodesState>[2];
	onEdgesChange: ReturnType<typeof import("@xyflow/react").useEdgesState>[2];
	onConnect: (connection: import("@xyflow/react").Connection) => void;
	setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
	undo: () => void;
	redo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	pushHistoryBeforeChange: () => void;
}

function CanvasWorkflowLayoutInner({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
	onConnect,
	setNodes,
	undo,
	redo,
	canUndo,
	canRedo,
	pushHistoryBeforeChange,
}: CanvasWorkflowLayoutProps) {
	const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [interactionMode, setInteractionMode] = useState<InteractionMode>("select");

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const raw = e.dataTransfer.getData(DRAG_TYPE);
			if (!raw) return;
			let payload: { type: NodeType };
			try {
				payload = JSON.parse(raw) as { type: NodeType };
			} catch {
				return;
			}
			const type = payload.type;
			const definition = NODE_REGISTRY[type];
			if (!definition) return;
			const screenToFlowPosition = flowInstanceRef.current?.screenToFlowPosition;
			if (!screenToFlowPosition) return;
			const position = screenToFlowPosition({
				x: e.clientX,
				y: e.clientY,
			});
			pushHistoryBeforeChange();
			const newNode: Node = {
				id: generateNodeId(),
				type,
				position,
				data: {
					type,
					config: { ...definition.defaultConfig },
				},
			};
			setNodes((nds) => [...nds, newNode]);
		},
		[setNodes, pushHistoryBeforeChange],
	);

	const onInit = useCallback((instance: ReactFlowInstance) => {
		flowInstanceRef.current = instance;
	}, []);

	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	}, []);

	return (
		<div className="flex h-full w-full">
			<CanvasNodeSidebar collapsed={sidebarCollapsed} />
			{/* Canvas column: trigger lives here so it stays on top of React Flow and is clearly outside the sidebar */}
			<div className="relative h-full flex-1">
				<Button
					variant="outline"
					size="icon"
					className="absolute left-0 top-4 z-20 size-9 shrink-0 -translate-x-1/2 rounded-full border-border bg-background shadow-md hover:bg-accent"
					onClick={() => setSidebarCollapsed((c) => !c)}
					title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{sidebarCollapsed ? (
						<PanelLeft className="size-4" />
					) : (
						<PanelLeftClose className="size-4" />
					)}
				</Button>
				<WorkflowCanvas
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onDrop={onDrop}
					onDragOver={onDragOver}
					onInit={onInit}
					bottomIsland={{
						interactionMode,
						onInteractionModeChange: setInteractionMode,
						onUndo: undo,
						onRedo: redo,
						canUndo,
						canRedo,
					}}
				/>
			</div>
		</div>
	);
}

export function CanvasWorkflowLayout(props: CanvasWorkflowLayoutProps) {
	return (
		<ReactFlowProvider>
			<CanvasWorkflowLayoutInner {...props} />
		</ReactFlowProvider>
	);
}
