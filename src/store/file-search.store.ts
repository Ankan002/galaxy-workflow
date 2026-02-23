import { create } from "zustand";

export type FileSearchStore = {
	search: string;
	setSearch: (value: string | ((prev: string) => string)) => void;
	resetSearch: () => void;
};

const initialState = { search: "" } satisfies Pick<FileSearchStore, "search">;

export const useFileSearchStore = create<FileSearchStore>()((set) => ({
	...initialState,
	setSearch: (value) =>
		set((state) => ({
			search: typeof value === "function" ? value(state.search) : value,
		})),
	resetSearch: () => set(initialState),
}));
