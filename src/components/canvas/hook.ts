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
	type Connection,
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
			const variant = getEdgeVariantFromConnection(nodes, connection);
			setEdges((eds) =>
				addEdge(
					{ ...connection, type: "workflow", data: { variant } },
					eds,
				),
			);
		},
		[nodes, setEdges],
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
