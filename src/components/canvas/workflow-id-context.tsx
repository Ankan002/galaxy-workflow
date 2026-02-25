"use client";

import { createContext, useContext } from "react";

const WorkflowIdContext = createContext<string | null>(null);

export function useWorkflowId(): string | null {
	return useContext(WorkflowIdContext);
}

export function WorkflowIdProvider({
	workflowId,
	children,
}: {
	workflowId: string;
	children: React.ReactNode;
}) {
	return (
		<WorkflowIdContext.Provider value={workflowId}>
			{children}
		</WorkflowIdContext.Provider>
	);
}
