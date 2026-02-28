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
	onDuplicate: (nodeId: string) => void | Promise<void>;
}

const noop = () => {};

const defaultValue: WorkflowNodePersistenceContextValue = {
	onNodeDetailsBlur: noop,
	onDuplicate: noop,
};

const WorkflowNodePersistenceContext =
	createContext<WorkflowNodePersistenceContextValue>(defaultValue);

export function useWorkflowNodePersistence() {
	return useContext(WorkflowNodePersistenceContext);
}

export function WorkflowNodePersistenceProvider({
	onNodeDetailsBlur,
	onDuplicate,
	children,
}: {
	onNodeDetailsBlur: WorkflowNodePersistenceContextValue["onNodeDetailsBlur"];
	onDuplicate: WorkflowNodePersistenceContextValue["onDuplicate"];
	children: React.ReactNode;
}) {
	const value = useMemo<WorkflowNodePersistenceContextValue>(
		() => ({
			onNodeDetailsBlur: onNodeDetailsBlur ?? noop,
			onDuplicate: onDuplicate ?? noop,
		}),
		[onNodeDetailsBlur, onDuplicate],
	);

	return (
		<WorkflowNodePersistenceContext.Provider value={value}>
			{children}
		</WorkflowNodePersistenceContext.Provider>
	);
}
