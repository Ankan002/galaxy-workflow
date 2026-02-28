import { create } from "zustand";

export interface NodeDetailsBlurPayload {
	config: Record<string, unknown>;
	positionX: number;
	positionY: number;
}

const noop = () => {};

interface WorkflowCanvasStore {
	workflowId: string | null;
	onNodeDetailsBlur: (
		nodeId: string,
		payload: NodeDetailsBlurPayload,
	) => void | Promise<void>;
	onDuplicate: (nodeId: string) => void | Promise<void>;
	onDelete: (nodeId: string) => void;

	setWorkflowId: (workflowId: string | null) => void;
	setOnNodeDetailsBlur: (
		fn: (
			nodeId: string,
			payload: NodeDetailsBlurPayload,
		) => void | Promise<void>,
	) => void;
	setOnDuplicate: (fn: (nodeId: string) => void | Promise<void>) => void;
	setOnDelete: (fn: (nodeId: string) => void) => void;
}

export const useWorkflowCanvasStore = create<WorkflowCanvasStore>()((set) => ({
	workflowId: null,
	onNodeDetailsBlur: noop,
	onDuplicate: noop,
	onDelete: noop,

	setWorkflowId: (workflowId) => set({ workflowId }),
	setOnNodeDetailsBlur: (fn) => set({ onNodeDetailsBlur: fn }),
	setOnDuplicate: (fn) => set({ onDuplicate: fn }),
	setOnDelete: (fn) => set({ onDelete: fn }),
}));
