"use client";

import { useWorkflowCanvas, CanvasWorkflowLayout } from "@/components/canvas";

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

	return (
		<div className="h-screen w-full">
			<CanvasWorkflowLayout
				workflowId={workflowId}
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
