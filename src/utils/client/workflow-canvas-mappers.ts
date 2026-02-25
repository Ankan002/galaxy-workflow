import type { Edge, Node } from "@xyflow/react";
import type { workflow_edge } from "@/db/prisma/browser";
import type { workflow_node } from "@/db/prisma/browser";

/** Variant for edge styling (used by WorkflowEdge and minimap). */
type EdgeVariant = "default" | "prompt" | "image" | "video" | "number" | "json" | "file";

/** Map (source node type, source handle) to edge variant for colorful edges in canvas and minimap. */
function getEdgeVariantForWorkflowEdge(
	sourceNodeType: string,
	sourceHandle: string,
): EdgeVariant {
	const t = sourceNodeType.toLowerCase();
	// Output handle types by node: text->value(string), image_upload->image, video_upload->url, run_llm->response(string), crop_image->image, extract_video_frame->output(string), extract_video->url
	if (t === "text" && sourceHandle === "value") return "prompt";
	if (t === "image_upload" && sourceHandle === "image") return "image";
	if (t === "video_upload" && sourceHandle === "url") return "video";
	if (t === "run_llm" && sourceHandle === "response") return "prompt";
	if (t === "crop_image" && sourceHandle === "image") return "image";
	if (t === "extract_video_frame" && sourceHandle === "output") return "prompt";
	if (t === "extract_video" && sourceHandle === "url") return "video";
	return "default";
}

/** DB stores node type as lowercase/snake_case; registry uses UPPERCASE. */
function workflowNodeTypeToRegistryType(dbType: string): string {
	return String(dbType).toUpperCase();
}

/** Infer minimum imageInputCount for RUN_LLM nodes from edges targeting them (target_handle image_0, image_1, ...). */
function getMinImageInputCountByTarget(
	edges: workflow_edge[],
): Map<string, number> {
	const map = new Map<string, number>();
	for (const e of edges) {
		const m = /^image_(\d+)$/.exec(e.target_handle);
		if (!m) continue;
		const index = parseInt(m[1], 10);
		const current = map.get(e.target_node_id) ?? -1;
		if (index > current) map.set(e.target_node_id, index);
	}
	return map;
}

/**
 * Maps API workflow nodes to React Flow nodes.
 * When `edges` is provided, RUN_LLM nodes get `config.imageInputCount` at least the max index from edges targeting them, so dynamic image handles exist when loading.
 */
export function mapWorkflowNodesToFlow(
	nodes: workflow_node[],
	edges?: workflow_edge[],
): Node[] {
	const minImageByTarget = edges != null ? getMinImageInputCountByTarget(edges) : null;
	return nodes.map((n) => {
		const registryType = workflowNodeTypeToRegistryType(n.type);
		let config: Record<string, unknown> = {};
		if (typeof n.config === "object" && n.config !== null) {
			config = n.config as Record<string, unknown>;
		} else if (typeof n.config === "string") {
			try {
				const parsed = JSON.parse(n.config) as Record<string, unknown>;
				config = typeof parsed === "object" && parsed !== null ? parsed : {};
		} catch {
			config = {};
		}
	}
	// Ensure RUN_LLM nodes have enough image slots for existing edges (dynamic handles image_0, image_1, ...)
	if (minImageByTarget && n.type === "run_llm") {
		const minSlots = minImageByTarget.get(n.id);
		if (minSlots != null) {
			const required = minSlots + 1;
			const current = Math.max(0, Math.floor(Number((config as Record<string, unknown>).imageInputCount) ?? 0));
			if (required > current) {
				config = { ...config, imageInputCount: required } as Record<string, unknown>;
			}
		}
	}
	let metadata: Record<string, unknown> | undefined;
		if (typeof n.metadata === "object" && n.metadata !== null) {
			metadata = n.metadata as Record<string, unknown>;
		} else if (typeof n.metadata === "string") {
			try {
				const parsed = JSON.parse(n.metadata) as Record<string, unknown>;
				metadata = typeof parsed === "object" && parsed !== null ? parsed : undefined;
			} catch {
				metadata = undefined;
			}
		}
		return {
			id: n.id,
			type: registryType,
			position: { x: n.position_x, y: n.position_y },
			data: {
				type: registryType,
				config,
				...(metadata && { metadata }),
			},
		};
	});
}

/**
 * Maps API workflow edges to React Flow edges.
 * When `sourceNodes` is provided, each edge gets a `data.variant` so edges render colorful in the canvas and minimap.
 */
export function mapWorkflowEdgesToFlow(
	edges: workflow_edge[],
	sourceNodes?: workflow_node[],
): Edge[] {
	const nodeMap = new Map(sourceNodes?.map((n) => [n.id, n]) ?? []);
	return edges.map((e) => {
		const sourceNode = nodeMap.get(e.source_node_id);
		const variant =
			sourceNode != null
				? getEdgeVariantForWorkflowEdge(sourceNode.type, e.source_handle)
				: "default";
		return {
			id: e.id,
			source: e.source_node_id,
			target: e.target_node_id,
			sourceHandle: e.source_handle,
			targetHandle: e.target_handle,
			data: { variant },
		};
	});
}
