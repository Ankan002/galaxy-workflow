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
			/>
		</div>
	);
};

export default WorkflowScreen;
