"use client";

import { CanvasWorkflowLayout } from "@/components/canvas";
import { useWorkflowFile } from "./hook";

interface WorkflowScreenProps {
	workflowId: string;
}

const WorkflowScreen = ({ workflowId }: WorkflowScreenProps) => {
	const workflow = useWorkflowFile({ workflowId });

	return (
		<div className="h-screen w-full">
			<CanvasWorkflowLayout
				workflowId={workflowId}
				workflowSidebar={workflow.workflowSidebar}
				nodes={workflow.nodes}
				edges={workflow.edges}
				onNodesChange={workflow.onNodesChange}
				onEdgesChange={workflow.onEdgesChange}
				onConnect={workflow.onConnect}
				setNodes={workflow.setNodes}
				undo={workflow.undo}
				redo={workflow.redo}
				canUndo={workflow.canUndo}
				canRedo={workflow.canRedo}
				pushHistoryBeforeChange={workflow.pushHistoryBeforeChange}
				onNodeCreated={workflow.onNodeCreated}
				isEditorDisabled={workflow.isEditorDisabled}
				onNodeDetailsBlur={workflow.onNodeDetailsBlur}
				onRunSelectedNode={workflow.runSelectedNode}
				onTriggerFlow={workflow.runFlow}
				isRunNodeLoading={workflow.isRunNodeLoading}
				isRunFlowLoading={workflow.isRunFlowLoading}
			/>
		</div>
	);
};

export default WorkflowScreen;
