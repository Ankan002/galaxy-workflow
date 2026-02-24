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

/** Triggers for workflow actions – use these to persist, audit, or react to changes. */
export interface WorkflowCanvasTriggers {
	/** Fired when a node is created (e.g. dropped from the sidebar or added via addNode). */
	onNodeCreated?: (node: Node) => void;
	/** Fired when a node is removed (delete key or removeNode). Receives the node id and the removed node data (if available). */
	onNodeDeleted?: (nodeId: string, node: Node | null) => void;
	/** Fired when a new edge is created (user connects two handles). Receives the connection and the new edge (with client id). */
	onEdgeCreated?: (connection: Connection, edge: Edge) => void;
	/** Fired when an edge is removed. */
	onEdgeDeleted?: (edgeId: string) => void;
	/** Fired when an edge is updated (e.g. reconnected – source/target/handles change). */
	onEdgeUpdated?: (edge: Edge) => void;
	/** Fired when the user triggers a workflow run (e.g. Run button). Use with a Run action in your UI. */
	onWorkflowRun?: (payload: WorkflowChangePayload) => void;
}

interface UseWorkflowCanvasOptions extends WorkflowCanvasTriggers {
	initialNodes?: Node[];
	initialEdges?: Edge[];
	/** Called whenever the workflow graph changes (nodes or edges). */
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
	const triggersRef = useRef({
		onNodeCreated: options.onNodeCreated,
		onNodeDeleted: options.onNodeDeleted,
		onEdgeCreated: options.onEdgeCreated,
		onEdgeDeleted: options.onEdgeDeleted,
		onEdgeUpdated: options.onEdgeUpdated,
		onWorkflowRun: options.onWorkflowRun,
	});

	const [historyLength, setHistoryLength] = useState(0);
	const [futureLength, setFutureLength] = useState(0);

	useEffect(() => {
		latestRef.current = { nodes, edges };
	}, [nodes, edges]);

	useEffect(() => {
		onWorkflowChangeRef.current = options.onWorkflowChange;
		triggersRef.current = {
			onNodeCreated: options.onNodeCreated,
			onNodeDeleted: options.onNodeDeleted,
			onEdgeCreated: options.onEdgeCreated,
			onEdgeDeleted: options.onEdgeDeleted,
			onEdgeUpdated: options.onEdgeUpdated,
			onWorkflowRun: options.onWorkflowRun,
		};
	}, [options.onWorkflowChange, options.onNodeCreated, options.onNodeDeleted, options.onEdgeCreated, options.onEdgeDeleted, options.onEdgeUpdated, options.onWorkflowRun]);

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
			const newEdges = addEdge(
				{ ...connection, type: "workflow", data: { variant } },
				latestRef.current.edges,
			);
			setEdges(newEdges);
			const newEdge = newEdges.find(
				(e) =>
					e.source === connection.source &&
					e.target === connection.target &&
					e.sourceHandle === connection.sourceHandle &&
					e.targetHandle === connection.targetHandle,
			);
			if (newEdge) triggersRef.current.onEdgeCreated?.(connection, newEdge);
		},
		[nodes, setEdges, pushHistoryBeforeChange],
	);

	const wrappedOnNodesChange = useCallback(
		(changes: NodeChange[]) => {
			const removeChanges = changes.filter((c) => c.type === "remove");
			if (removeChanges.length > 0) {
				pushHistoryBeforeChange();
				const { nodes: currentNodes } = latestRef.current;
				for (const c of removeChanges) {
					if (c.type === "remove") {
						const node = currentNodes.find((n) => n.id === c.id) ?? null;
						triggersRef.current.onNodeDeleted?.(c.id, node);
					}
				}
			}
			onNodesChange(changes);
		},
		[onNodesChange, pushHistoryBeforeChange],
	);

	const wrappedOnEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			const removeChanges = changes.filter((c) => c.type === "remove");
			if (removeChanges.length > 0) {
				pushHistoryBeforeChange();
				for (const c of removeChanges) {
					if (c.type === "remove") {
						triggersRef.current.onEdgeDeleted?.(c.id);
					}
				}
			}
			const replaceChanges = changes.filter(
				(c): c is EdgeChange & { type: "replace"; item: Edge } =>
					c.type === "replace" && "item" in c && c.item != null,
			);
			if (replaceChanges.length > 0) {
				pushHistoryBeforeChange();
				for (const c of replaceChanges) {
					triggersRef.current.onEdgeUpdated?.(c.item);
				}
			}
			onEdgesChange(changes);
		},
		[onEdgesChange, pushHistoryBeforeChange],
	);

	const handleDeleteEdge = useCallback(
		(edgeId: string) => {
			pushHistoryBeforeChange();
			setEdges((eds) => eds.filter((e) => e.id !== edgeId));
			triggersRef.current.onEdgeDeleted?.(edgeId);
		},
		[setEdges, pushHistoryBeforeChange],
	);

	const addNode = useCallback(
		(node: Node) => {
			setNodes((nds) => [...nds, node]);
			triggersRef.current.onNodeCreated?.(node);
		},
		[setNodes],
	);

	const removeNode = useCallback(
		(nodeId: string) => {
			const node = latestRef.current.nodes.find((n) => n.id === nodeId) ?? null;
			pushHistoryBeforeChange();
			setNodes((nds) => nds.filter((n) => n.id !== nodeId));
			setEdges((eds) =>
				eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
			);
			triggersRef.current.onNodeDeleted?.(nodeId, node);
		},
		[setNodes, setEdges, pushHistoryBeforeChange],
	);

	/** Call this when the user triggers a workflow run (e.g. Run button). Fires onWorkflowRun and returns current nodes/edges. */
	const triggerWorkflowRun = useCallback(() => {
		const payload = { nodes: latestRef.current.nodes, edges: latestRef.current.edges };
		triggersRef.current.onWorkflowRun?.(payload);
		return payload;
	}, []);

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
		triggerWorkflowRun,
		/** Pass to layout so it can fire onNodeCreated when a node is dropped from the sidebar. */
		onNodeCreated: options.onNodeCreated,
	};
}
