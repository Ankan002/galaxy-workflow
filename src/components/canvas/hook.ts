"use client";

import { useCallback } from "react";
import {
	useNodesState,
	useEdgesState,
	addEdge,
	type Node,
	type Edge,
	type OnConnect,
	type OnNodesDelete,
	type OnEdgesDelete,
} from "@xyflow/react";

interface UseWorkflowCanvasOptions {
	initialNodes?: Node[];
	initialEdges?: Edge[];
	onNodesChange?: () => void;
	onEdgesChange?: () => void;
	onNodesDelete?: OnNodesDelete;
	onEdgesDelete?: OnEdgesDelete;
}

export function useWorkflowCanvas(options: UseWorkflowCanvasOptions = {}) {
	const [nodes, setNodes, onNodesChange] = useNodesState(
		options.initialNodes ?? [],
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState(
		options.initialEdges ?? [],
	);

	const onConnect: OnConnect = useCallback(
		(connection) => {
			setEdges((eds) => addEdge({ ...connection, type: "workflow" }, eds));
		},
		[setEdges],
	);

	const handleDeleteEdge = useCallback(
		(edgeId: string) => {
			setEdges((eds) => eds.filter((e) => e.id !== edgeId));
		},
		[setEdges],
	);

	const addNode = useCallback(
		(node: Node) => {
			setNodes((nds) => [...nds, node]);
		},
		[setNodes],
	);

	const removeNode = useCallback(
		(nodeId: string) => {
			setNodes((nds) => nds.filter((n) => n.id !== nodeId));
			setEdges((eds) =>
				eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
			);
		},
		[setNodes, setEdges],
	);

	return {
		nodes,
		edges,
		setNodes,
		setEdges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		handleDeleteEdge,
		addNode,
		removeNode,
	};
}
