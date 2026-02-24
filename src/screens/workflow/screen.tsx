"use client";

import { useWorkflowCanvas, CanvasWorkflowLayout } from "@/components/canvas";
import { useWorkflowFile } from "./hook";

interface WorkflowScreenProps {
	workflowId: string;
}

const WorkflowScreen = ({ workflowId }: WorkflowScreenProps) => {
	const {
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
	} = useWorkflowCanvas();

	const workflowFile = useWorkflowFile({ workflowId });

	return (
		<div className="h-screen w-full">
			<CanvasWorkflowLayout
				workflowId={workflowId}
				workflowSidebar={workflowFile}
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				setNodes={setNodes}
				undo={undo}
				redo={redo}
				canUndo={canUndo}
				canRedo={canRedo}
				pushHistoryBeforeChange={pushHistoryBeforeChange}
				onNodeCreated={onNodeCreated}
			/>
		</div>
	);
};

export default WorkflowScreen;
