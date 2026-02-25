import type { Connection, Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	DASHBOARD_URL,
	API_ROUTES,
} from "@/config/client-constants";
import { useAPIErrorHandler } from "@/hooks/use-error-handler";
import {
	exportWorkflow,
	useCreateWorkflowFile,
	useGetWorkflowFile,
	useImportWorkflow,
	useUpdateWorkflowFile,
} from "@/services/client-api/workflow-file";
import { workflowExportPayloadSchema } from "@/lib/workflow-export/schema";
import {
	useCreateWorkflowNode,
	useDeleteWorkflowNode,
	useGetWorkflowNodes,
	useUpdateWorkflowNodeMutation,
	executeWorkflowNode as executeWorkflowNodeApi,
} from "@/services/client-api/workflow-nodes";
import { executeWorkflowFlow as executeWorkflowFlowApi } from "@/services/client-api/workflow-executions/execute-workflow-flow";
import {
	useCreateWorkflowEdge,
	useDeleteWorkflowEdge,
	useGetWorkflowEdges,
} from "@/services/client-api/workflow-edges";
import { useWorkflowCanvas } from "@/components/canvas";
import type { WorkflowCanvasTriggers } from "@/components/canvas";
import {
	mapWorkflowEdgesToFlow,
	mapWorkflowNodesToFlow,
} from "@/utils/client/workflow-canvas-mappers";

interface UseWorkflowFileArgs {
	workflowId: string;
}

export const useWorkflowFile = ({ workflowId }: UseWorkflowFileArgs) => {
	const queryClient = useQueryClient();
	const canvasStateRef = useRef<{
		setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
		setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
	} | null>(null);
	const router = useRouter();
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);
	const [renameValue, setRenameValue] = useState("");

	const { APIErrorHandler } = useAPIErrorHandler();
	const getWorkflowFileErrorHandler = APIErrorHandler();
	const createWorkflowFileErrorHandler = APIErrorHandler();
	const updateWorkflowFileErrorHandler = APIErrorHandler();
	const createNodeErrorHandler = APIErrorHandler();
	const deleteNodeErrorHandler = APIErrorHandler();
	const createEdgeErrorHandler = APIErrorHandler();
	const deleteEdgeErrorHandler = APIErrorHandler();
	const updateNodeErrorHandler = APIErrorHandler();
	const getWorkflowNodesErrorHandler = APIErrorHandler();
	const getWorkflowEdgesErrorHandler = APIErrorHandler();

	const { data: workflowFile, error: workflowFileError } = useGetWorkflowFile(
		{ workflowId },
	);
	const {
		data: workflowNodes,
		error: workflowNodesError,
		isLoading: isLoadingWorkflowNodes,
	} = useGetWorkflowNodes({ workflowId });
	const {
		data: workflowEdges,
		error: workflowEdgesError,
		isLoading: isLoadingWorkflowEdges,
	} = useGetWorkflowEdges({ workflowId });

	const { mutateAsync: createWorkflowFile, isPending: isCreatingNewFile } =
		useCreateWorkflowFile();
	const { mutateAsync: updateWorkflowFile, isPending: isRenaming } =
		useUpdateWorkflowFile(workflowId);
	const { mutateAsync: createWorkflowNode } =
		useCreateWorkflowNode(workflowId);
	const { mutateAsync: deleteWorkflowNode } =
		useDeleteWorkflowNode(workflowId);
	const { mutateAsync: createWorkflowEdge } =
		useCreateWorkflowEdge(workflowId);
	const { mutateAsync: deleteWorkflowEdge } =
		useDeleteWorkflowEdge(workflowId);
	const { mutateAsync: updateWorkflowNode } =
		useUpdateWorkflowNodeMutation(workflowId);

	const { mutateAsync: executeWorkflowNode, isPending: isRunNodeLoading } =
		useMutation({
			mutationFn: (args: { workflowId: string; nodeId: string }) =>
				executeWorkflowNodeApi(args),
		});
	const { mutateAsync: executeWorkflowFlow, isPending: isRunFlowLoading } =
		useMutation({
			mutationFn: (args: { workflowId: string }) =>
				executeWorkflowFlowApi(args),
		});

	const [isExporting, setIsExporting] = useState(false);
	const { mutateAsync: importWorkflowMutation, isPending: isImporting } =
		useImportWorkflow();

	useEffect(() => {
		if (workflowFileError) {
			getWorkflowFileErrorHandler(workflowFileError);
		}
	}, [workflowFileError, getWorkflowFileErrorHandler]);

	function onBackToDashboard() {
		router.push(DASHBOARD_URL);
	}

	async function onNewFile() {
		if (isCreatingNewFile) {
			toast.error(
				"Please wait for the current workflow file to be created before creating a new one!",
			);
			return;
		}
		try {
			const file = await createWorkflowFile();
			toast.success("Workflow file created successfully!");
			router.push(`/workflow/${file.id}`);
		} catch (error) {
			createWorkflowFileErrorHandler(error);
		}
	}

	function onOpenRename() {
		setRenameValue(workflowFile?.name ?? "");
		setRenameDialogOpen(true);
	}

	async function onRenameSubmit() {
		const name = renameValue.trim();
		if (!name) return;
		try {
			await updateWorkflowFile(name);
			setRenameDialogOpen(false);
			toast.success("Workflow file renamed successfully!");
		} catch (error) {
			updateWorkflowFileErrorHandler(error);
		}
	}

	async function onNodeCreated(node: Node) {
		try {
			console.log("onNodeCreated", node);
			const serverNode = await createWorkflowNode({
				type: (node.type as string)?.toLowerCase() ?? "text",
				provider: "internal",
				positionX: node.position.x,
				positionY: node.position.y,
				config: (node.data?.config as Record<string, unknown>) ?? {},
			});
			const state = canvasStateRef?.current;
			if (state) {
				state.setNodes((prev) =>
					prev.map((n) =>
						n.id === node.id ? { ...n, id: serverNode.id } : n,
					),
				);
				state.setEdges((prev) =>
					prev.map((e) => ({
						...e,
						source: e.source === node.id ? serverNode.id : e.source,
						target: e.target === node.id ? serverNode.id : e.target,
					})),
				);
			}
		} catch (error) {
			createNodeErrorHandler(error);
		}
	}

	async function onNodeDeleted(nodeId: string) {
		try {
			await deleteWorkflowNode(nodeId);
		} catch (error) {
			deleteNodeErrorHandler(error);
		}
	}

	async function onEdgeCreated(connection: Connection, edge: Edge) {
		try {
			const serverEdge = await createWorkflowEdge({
				sourceNodeId: connection.source,
				targetNodeId: connection.target ?? "",
				sourceHandle: connection.sourceHandle ?? "",
				targetHandle: connection.targetHandle ?? "",
			});
			const state = canvasStateRef?.current;
			if (state) {
				state.setEdges((prev) =>
					prev.map((e) =>
						e.id === edge.id ? { ...e, id: serverEdge.id } : e,
					),
				);
			}
		} catch (error) {
			// Revert the optimistically added edge so UI stays in sync with server (e.g. duplicate edge 409)
			const state = canvasStateRef?.current;
			if (state) {
				state.setEdges((prev) => prev.filter((e) => e.id !== edge.id));
			}
			createEdgeErrorHandler(error);
		}
	}

	async function onEdgeDeleted(edgeId: string) {
		try {
			await deleteWorkflowEdge(edgeId);
		} catch (error) {
			deleteEdgeErrorHandler(error);
		}
	}

	async function onEdgeUpdated(edge: Edge) {
		try {
			await deleteWorkflowEdge(edge.id);
			const serverEdge = await createWorkflowEdge({
				sourceNodeId: edge.source,
				targetNodeId: edge.target,
				sourceHandle: edge.sourceHandle ?? "",
				targetHandle: edge.targetHandle ?? "",
			});
			const state = canvasStateRef?.current;
			if (state) {
				state.setEdges((prev) =>
					prev.map((e) =>
						e.id === edge.id ? { ...e, id: serverEdge.id } : e,
					),
				);
			}
		} catch (error) {
			deleteEdgeErrorHandler(error);
		}
	}

	const flushPositionUpdate = useRef<{
		nodeId: string;
		x: number;
		y: number;
	} | null>(null);
	const debouncedPersistPosition = useDebouncedCallback(
		async () => {
			const pending = flushPositionUpdate.current;
			flushPositionUpdate.current = null;
			if (!pending) return;
			try {
				await updateWorkflowNode({
					workflowId,
					nodeId: pending.nodeId,
					positionX: pending.x,
					positionY: pending.y,
				});
			} catch (error) {
				updateNodeErrorHandler(error);
			}
		},
		400,
		{ leading: false, trailing: true },
	);

	function onNodePositionChange(nodeId: string, position: { x: number; y: number }) {
		flushPositionUpdate.current = { nodeId, x: position.x, y: position.y };
		debouncedPersistPosition();
	}

	const workflowCanvasEvents: WorkflowCanvasTriggers = {
		onNodeCreated,
		onNodeDeleted,
		onEdgeCreated,
		onEdgeDeleted,
		onEdgeUpdated,
		onNodePositionChange,
	};

	const hydratedForWorkflowIdRef = useRef<string | null>(null);

	const {
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		setNodes,
		setEdges,
		undo,
		redo,
		canUndo,
		canRedo,
		pushHistoryBeforeChange,
		onNodeCreated: onNodeCreatedPassThrough,
	} = useWorkflowCanvas(workflowCanvasEvents);

	useEffect(() => {
		if (
			workflowNodes === undefined ||
			workflowEdges === undefined ||
			hydratedForWorkflowIdRef.current === workflowId
		) {
			return;
		}
		setNodes(mapWorkflowNodesToFlow(workflowNodes, workflowEdges));
		setEdges(mapWorkflowEdgesToFlow(workflowEdges, workflowNodes));
		hydratedForWorkflowIdRef.current = workflowId;
	}, [workflowId, workflowNodes, workflowEdges, setNodes, setEdges]);

	useEffect(() => {
		canvasStateRef.current = { setNodes, setEdges };
		return () => {
			canvasStateRef.current = null;
		};
	}, [setNodes, setEdges]);

	useEffect(() => {
		if (workflowNodesError) {
			getWorkflowNodesErrorHandler(workflowNodesError);
		}
	}, [workflowNodesError]);

	useEffect(() => {
		if (workflowEdgesError) {
			getWorkflowEdgesErrorHandler(workflowEdgesError);
		}
	}, [workflowEdgesError]);

	const isEditorDisabled =
		isLoadingWorkflowNodes || isLoadingWorkflowEdges;

	const onNodeDetailsBlur = useCallback(
		async (
			nodeId: string,
			payload: {
				config: Record<string, unknown>;
				positionX: number;
				positionY: number;
			},
		) => {
			try {
				await updateWorkflowNode({
					workflowId,
					nodeId,
					config: payload.config,
					positionX: payload.positionX,
					positionY: payload.positionY,
				});
			} catch (error) {
				updateNodeErrorHandler(error);
			}
		},
		[workflowId, updateWorkflowNode, updateNodeErrorHandler],
	);

	const runSelectedNode = useCallback(async () => {
		const selected = nodes.find((n) => n.selected);
		if (!selected) {
			toast.error("Select a node to run");
			return;
		}
		try {
			await executeWorkflowNode({ workflowId, nodeId: selected.id });
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_EXECUTIONS.LIST.key, workflowId],
			});
			toast.success("Execution started");
		} catch (error) {
			updateNodeErrorHandler(error);
		}
	}, [workflowId, nodes, executeWorkflowNode, updateNodeErrorHandler, queryClient]);

	const runFlow = useCallback(async () => {
		try {
			await executeWorkflowFlow({ workflowId });
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.WORKFLOW_EXECUTIONS.LIST.key, workflowId],
			});
			toast.success("Full flow execution started");
		} catch (error) {
			updateNodeErrorHandler(error);
		}
	}, [workflowId, executeWorkflowFlow, updateNodeErrorHandler, queryClient]);

	const onExport = useCallback(async () => {
		setIsExporting(true);
		try {
			const payload = await exportWorkflow({ workflowId });
			const blob = new Blob([JSON.stringify(payload, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${payload.name.replace(/[^a-zA-Z0-9-_]/g, "_")}_workflow.json`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success("Workflow exported");
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setIsExporting(false);
		}
	}, [workflowId]);

	const onImportFile = useCallback(
		async (file: File) => {
			try {
				const text = await file.text();
				const raw = JSON.parse(text) as unknown;
				// Accept either raw payload or wrapped API response { success, data }
				const payloadCandidate =
					typeof raw === "object" &&
					raw !== null &&
					"data" in (raw as { data?: unknown }) &&
					typeof (raw as { success?: boolean }).success === "boolean"
						? (raw as { data: unknown }).data
						: raw;
				const parsed = workflowExportPayloadSchema.safeParse(payloadCandidate);
				if (!parsed.success) {
					const msg = parsed.error.issues.map((e) => e.message).join("; ");
					toast.error(`Invalid workflow file: ${msg}`);
					return;
				}
				const result = await importWorkflowMutation({ payload: parsed.data });
				toast.success(`Workflow "${result.workflow_name}" imported`);
				router.push(`/workflow/${result.workflow_id}`);
			} catch (err) {
				if (err instanceof SyntaxError) {
					toast.error("Invalid JSON in file");
					return;
				}
				APIErrorHandler()(err);
			}
		},
		[importWorkflowMutation, router],
	);

	return {
		workflowSidebar: {
			workflowFile,
			onBackToDashboard,
			onNewFile,
			onOpenRename,
			onRenameSubmit,
			renameDialogOpen,
			setRenameDialogOpen,
			renameValue,
			setRenameValue,
			isCreatingNewFile,
			isRenaming,
			onExport,
			onImportFile,
			isExporting,
			isImporting,
		},
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
		onNodeCreated: onNodeCreatedPassThrough,
		isEditorDisabled,
		onNodeDetailsBlur,
		runSelectedNode,
		runFlow,
		isRunNodeLoading,
		isRunFlowLoading,
	};
};
