"use client";

import { useWorkflowCanvas, CanvasWorkflowLayout } from "@/components/canvas";

const WorkflowScreen = () => {
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
	} = useWorkflowCanvas();

	return (
		<div className="h-screen w-full">
			<CanvasWorkflowLayout
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
			/>
		</div>
	);
};

export default WorkflowScreen;
