import z from "zod";

/** Supported workflow node types (must match DB enum). */
export const workflowNodeTypeSchema = z.enum([
	"text",
	"image_upload",
	"video_upload",
	"run_llm",
	"crop_image",
	"extract_video_frame",
]);

/** Supported workflow node providers (must match DB enum). */
export const workflowNodeProviderSchema = z.enum([
	"internal",
	"trigger",
	"transloadit",
]);

/** Single node in export/import payload. */
export const workflowExportNodeSchema = z.object({
	id: z.string().min(1, "Node id is required"),
	type: workflowNodeTypeSchema,
	provider: workflowNodeProviderSchema,
	position_x: z.number(),
	position_y: z.number(),
	config: z.record(z.string(), z.unknown()).default({}),
	metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

/** Single edge in export/import payload. */
export const workflowExportEdgeSchema = z.object({
	source_node_id: z.string().min(1),
	target_node_id: z.string().min(1),
	source_handle: z.string().min(1),
	target_handle: z.string().min(1),
});

/** Full workflow export/import JSON shape. */
export const workflowExportPayloadSchema = z.object({
	version: z.union([z.literal(1), z.literal("1")]).transform(() => 1 as const),
	name: z.string().min(1, "Workflow name is required").max(500),
	nodes: z.array(workflowExportNodeSchema).default([]),
	edges: z.array(workflowExportEdgeSchema).default([]),
});

export type WorkflowExportPayload = z.infer<typeof workflowExportPayloadSchema>;
export type WorkflowExportNode = z.infer<typeof workflowExportNodeSchema>;
export type WorkflowExportEdge = z.infer<typeof workflowExportEdgeSchema>;
