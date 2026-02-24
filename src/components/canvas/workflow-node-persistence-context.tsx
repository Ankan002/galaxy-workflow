"use client";

import { createContext, useContext, useMemo } from "react";

export interface NodeDetailsBlurPayload {
	config: Record<string, unknown>;
	positionX: number;
	positionY: number;
}

export interface WorkflowNodePersistenceContextValue {
	onNodeDetailsBlur: (
		nodeId: string,
		payload: NodeDetailsBlurPayload,
	) => void | Promise<void>;
}

const noop = () => {};

const defaultValue: WorkflowNodePersistenceContextValue = {
	onNodeDetailsBlur: noop,
};

const WorkflowNodePersistenceContext =
	createContext<WorkflowNodePersistenceContextValue>(defaultValue);

export function useWorkflowNodePersistence() {
	return useContext(WorkflowNodePersistenceContext);
}

export function WorkflowNodePersistenceProvider({
	onNodeDetailsBlur,
	children,
}: {
	onNodeDetailsBlur: WorkflowNodePersistenceContextValue["onNodeDetailsBlur"];
	children: React.ReactNode;
}) {
	const value = useMemo<WorkflowNodePersistenceContextValue>(
		() => ({
			onNodeDetailsBlur: onNodeDetailsBlur ?? noop,
		}),
		[onNodeDetailsBlur],
	);

	return (
		<WorkflowNodePersistenceContext.Provider value={value}>
			{children}
		</WorkflowNodePersistenceContext.Provider>
	);
}
