/** Target handle keys on crop node that accept a value from text (percentage 0–100). */
export const CROP_PERCENT_TARGET_HANDLES = [
	"x_percent",
	"y_percent",
	"width_percent",
	"height_percent",
] as const;

export type CropPercentHandleKey = (typeof CROP_PERCENT_TARGET_HANDLES)[number];

export function isCropPercentHandle(handle: string): handle is CropPercentHandleKey {
	return (CROP_PERCENT_TARGET_HANDLES as readonly string[]).includes(handle);
}

/**
 * Parses a value as a percentage 0–100. Returns the number if valid, null otherwise.
 * Used when syncing text node value into crop node config (client-side).
 */
export function parsePercentageClient(value: unknown): number | null {
	if (value == null) return null;
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return null;
	return Math.min(100, Math.max(0, n));
}
