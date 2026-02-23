"use client";

import { WorkflowCanvas } from "@/components/canvas";

const WorkflowScreen = () => {
	return (
		<div className="w-full min-h-screen flex flex-col">
			<WorkflowCanvas
				nodes={[]}
				edges={[]}
				onNodesChange={() => {}}
				onEdgesChange={() => {}}
				onConnect={() => {}}
			/>
		</div>
	);
};

export default WorkflowScreen;
