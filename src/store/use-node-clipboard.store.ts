import { create } from "zustand";

interface NodeClipboardStore {
	nodeId: string | null;
	setNodeId: (nodeId: string | null) => void;
}

export const useNodeClipboardStore = create<NodeClipboardStore>()((set) => ({
	nodeId: null,
	setNodeId: (nodeId) => set({ nodeId }),
}));
