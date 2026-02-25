/** Allowed model ids for Run LLM node (must match dropdown in run-llm-node.tsx). */
export const ALLOWED_LLM_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"] as const;

export const DEFAULT_LLM_MODEL = "gemini-2.5-flash";

/**
 * Returns the selected model if it's in the allowed list, otherwise the default.
 * Use when building run-llm payload so the dropdown selection is always respected.
 */
export function getValidLlmModel(value: unknown): string {
	const s = typeof value === "string" ? value.trim() : "";
	return (ALLOWED_LLM_MODELS as readonly string[]).includes(s) ? s : DEFAULT_LLM_MODEL;
}
