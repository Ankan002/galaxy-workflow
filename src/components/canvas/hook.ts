"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import {
	useNodesState,
	useEdgesState,
	addEdge,
	type Node,
	type Edge,
	type OnConnect,
	type OnNodesDelete,
	type OnEdgesDelete,
	type Connection,
	type NodeChange,
	type EdgeChange,
} from "@xyflow/react";
import { NODE_REGISTRY } from "./nodes/registry";
import type { BaseEdgeData } from "./edges";

function getEdgeVariantFromConnection(
	nodes: Node[],
	connection: Connection,
): BaseEdgeData["variant"] {
	const sourceNode = nodes.find((n) => n.id === connection.source);
	if (!sourceNode?.type || typeof sourceNode.type !== "string") return "default";
	const def = NODE_REGISTRY[sourceNode.type as keyof typeof NODE_REGISTRY];
	if (!def?.outputHandles) return "default";
	const handle = def.outputHandles.find((h) => h.key === connection.sourceHandle);
	if (!handle) return "default";
	const t = handle.type;
	if (t === "string") return "prompt";
	if (t === "image") return "image";
	if (t === "video") return "video";
	if (t === "number") return "number";
	if (t === "json") return "json";
	if (t === "file") return "file";
	return "default";
}

function snapshot(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
	return {
		nodes: JSON.parse(JSON.stringify(nodes)),
		edges: JSON.parse(JSON.stringify(edges)),
	};
}

export type WorkflowChangePayload = { nodes: Node[]; edges: Edge[] };

interface UseWorkflowCanvasOptions {
	initialNodes?: Node[];
	initialEdges?: Edge[];
	/** Called whenever the workflow graph changes (nodes or edges). Debounced or called after meaningful actions. */
	onWorkflowChange?: (payload: WorkflowChangePayload) => void;
	onNodesDelete?: OnNodesDelete;
	onEdgesDelete?: OnEdgesDelete;
}

const MAX_HISTORY = 50;

export function useWorkflowCanvas(options: UseWorkflowCanvasOptions = {}) {
	const [nodes, setNodes, onNodesChange] = useNodesState(
		options.initialNodes ?? [],
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState(
		options.initialEdges ?? [],
	);

	const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
	const futureRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
	const isUndoRedoRef = useRef(false);
	const latestRef = useRef({ nodes, edges });
	const onWorkflowChangeRef = useRef(options.onWorkflowChange);

	const [historyLength, setHistoryLength] = useState(0);
	const [futureLength, setFutureLength] = useState(0);

	useEffect(() => {
		latestRef.current = { nodes, edges };
	}, [nodes, edges]);

	useEffect(() => {
		onWorkflowChangeRef.current = options.onWorkflowChange;
	}, [options.onWorkflowChange]);

	useEffect(() => {
		const fn = onWorkflowChangeRef.current;
		if (fn) fn({ nodes, edges });
	}, [nodes, edges]);

	const pushHistoryBeforeChange = useCallback(() => {
		if (isUndoRedoRef.current) return;
		const { nodes: n, edges: e } = latestRef.current;
		historyRef.current.push(snapshot(n, e));
		if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
		futureRef.current = [];
		setHistoryLength(historyRef.current.length);
		setFutureLength(0);
	}, []);

	const undo = useCallback(() => {
		if (historyRef.current.length === 0) return;
		const prev = historyRef.current.pop()!;
		futureRef.current.push(snapshot(latestRef.current.nodes, latestRef.current.edges));
		isUndoRedoRef.current = true;
		setNodes(prev.nodes);
		setEdges(prev.edges);
		isUndoRedoRef.current = false;
		setHistoryLength(historyRef.current.length);
		setFutureLength(futureRef.current.length);
	}, [setNodes, setEdges]);

	const redo = useCallback(() => {
		if (futureRef.current.length === 0) return;
		const next = futureRef.current.pop()!;
		historyRef.current.push(snapshot(latestRef.current.nodes, latestRef.current.edges));
		isUndoRedoRef.current = true;
		setNodes(next.nodes);
		setEdges(next.edges);
		isUndoRedoRef.current = false;
		setHistoryLength(historyRef.current.length);
		setFutureLength(futureRef.current.length);
	}, [setNodes, setEdges]);

	const canUndo = historyLength > 0;
	const canRedo = futureLength > 0;

	const onConnect: OnConnect = useCallback(
		(connection) => {
			pushHistoryBeforeChange();
			const variant = getEdgeVariantFromConnection(nodes, connection);
			setEdges((eds) =>
				addEdge(
					{ ...connection, type: "workflow", data: { variant } },
					eds,
				),
			);
		},
		[nodes, setEdges, pushHistoryBeforeChange],
	);

	const wrappedOnNodesChange = useCallback(
		(changes: NodeChange[]) => {
			const hasRemove = changes.some((c) => c.type === "remove");
			if (hasRemove) pushHistoryBeforeChange();
			onNodesChange(changes);
		},
		[onNodesChange, pushHistoryBeforeChange],
	);

	const wrappedOnEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			const hasRemove = changes.some((c) => c.type === "remove");
			if (hasRemove) pushHistoryBeforeChange();
			onEdgesChange(changes);
		},
		[onEdgesChange, pushHistoryBeforeChange],
	);

	const handleDeleteEdge = useCallback(
		(edgeId: string) => {
			pushHistoryBeforeChange();
			setEdges((eds) => eds.filter((e) => e.id !== edgeId));
		},
		[setEdges, pushHistoryBeforeChange],
	);

	const addNode = useCallback(
		(node: Node) => {
			setNodes((nds) => [...nds, node]);
		},
		[setNodes],
	);

	const removeNode = useCallback(
		(nodeId: string) => {
			pushHistoryBeforeChange();
			setNodes((nds) => nds.filter((n) => n.id !== nodeId));
			setEdges((eds) =>
				eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
			);
		},
		[setNodes, setEdges, pushHistoryBeforeChange],
	);

	return {
		nodes,
		edges,
		setNodes,
		setEdges,
		onNodesChange: wrappedOnNodesChange,
		onEdgesChange: wrappedOnEdgesChange,
		onConnect,
		handleDeleteEdge,
		addNode,
		removeNode,
		undo,
		redo,
		canUndo,
		canRedo,
		pushHistoryBeforeChange,
	};
}
