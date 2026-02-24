"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
	ReactFlowProvider,
	type Node,
	type ReactFlowInstance,
} from "@xyflow/react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowCanvas } from "./workflow-canvas";
import { CanvasNodeSidebar } from "./canvas-node-sidebar";
import { CanvasRightSidebar } from "./canvas-right-sidebar";
import { WorkflowNodePersistenceProvider } from "./workflow-node-persistence-context";
import { NODE_REGISTRY, NodeType } from "./nodes/registry";
import type { InteractionMode } from "./canvas-bottom-island";

const DRAG_TYPE = "application/reactflow";

function generateNodeId(): string {
	return `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

import type { workflow_file } from "@/db/prisma/browser";

export interface WorkflowSidebarProps {
	workflowFile: workflow_file | undefined;
	onBackToDashboard: () => void;
	onNewFile: () => void;
	onOpenRename: () => void;
	onRenameSubmit: () => void;
	renameDialogOpen: boolean;
	setRenameDialogOpen: (open: boolean) => void;
	renameValue: string;
	setRenameValue: (value: string) => void;
	isCreatingNewFile: boolean;
	isRenaming: boolean;
}

interface CanvasWorkflowLayoutProps {
	workflowId: string;
	workflowSidebar: WorkflowSidebarProps;
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
	/** Fired when a node is created by dropping from the sidebar. Optional. */
	onNodeCreated?: (node: Node) => void;
	/** When true, disables node/edge editing, connecting, and dropping new nodes. */
	isEditorDisabled?: boolean;
	/** Called when a node’s config/position should be persisted (e.g. on blur). */
	onNodeDetailsBlur?: (
		nodeId: string,
		payload: {
			config: Record<string, unknown>;
			positionX: number;
			positionY: number;
		},
	) => void | Promise<void>;
}

function CanvasWorkflowLayoutInner({
	workflowId,
	workflowSidebar,
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
	onNodeCreated,
	isEditorDisabled = false,
	onNodeDetailsBlur,
}: CanvasWorkflowLayoutProps) {
	const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
	const [interactionMode, setInteractionMode] =
		useState<InteractionMode>("select");

	const hasSelectedNode = useMemo(
		() => nodes.some((n) => n.selected),
		[nodes],
	);

	const handleRunSelectedNode = useCallback(() => {
		// TODO: wire to run selected node action
	}, []);
	const handleTriggerFlow = useCallback(() => {
		// TODO: wire to trigger whole flow action
	}, []);

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			if (isEditorDisabled) return;
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
			const screenToFlowPosition =
				flowInstanceRef.current?.screenToFlowPosition;
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
			onNodeCreated?.(newNode);
		},
		[setNodes, pushHistoryBeforeChange, onNodeCreated, isEditorDisabled],
	);

	const onInit = useCallback((instance: ReactFlowInstance) => {
		flowInstanceRef.current = instance;
	}, []);

	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	}, []);

	return (
		<WorkflowNodePersistenceProvider onNodeDetailsBlur={onNodeDetailsBlur ?? (() => {})}>
		<div className="flex h-full w-full">
			<CanvasNodeSidebar
				workflowSidebar={workflowSidebar}
				collapsed={sidebarCollapsed}
			/>
			{/* Canvas column: trigger lives here so it stays on top of React Flow and is clearly outside the sidebar */}
			<div className="relative h-full flex-1">
				<Button
					variant="outline"
					size="icon"
					className="absolute bottom-4 left-0 z-20 size-9 shrink-0 -translate-x-1/2 rounded-full border-border bg-background shadow-md hover:bg-accent"
					onClick={() => setSidebarCollapsed((c) => !c)}
					title={
						sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
					}
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
					readOnly={isEditorDisabled}
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
			<CanvasRightSidebar
				collapsed={rightSidebarCollapsed}
				onToggleCollapsed={() => setRightSidebarCollapsed((c) => !c)}
				hasSelectedNode={hasSelectedNode}
				onRunSelectedNode={handleRunSelectedNode}
				onTriggerFlow={handleTriggerFlow}
				disabled={isEditorDisabled}
			/>
		</div>
		</WorkflowNodePersistenceProvider>
	);
}

export function CanvasWorkflowLayout(props: CanvasWorkflowLayoutProps) {
	return (
		<ReactFlowProvider>
			<CanvasWorkflowLayoutInner {...props} />
		</ReactFlowProvider>
	);
}
