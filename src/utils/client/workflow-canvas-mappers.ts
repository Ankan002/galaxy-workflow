import type { Edge, Node } from "@xyflow/react";
import type { workflow_edge } from "@/db/prisma/browser";
import type { workflow_node } from "@/db/prisma/browser";

/** DB stores node type as lowercase/snake_case; registry uses UPPERCASE. */
function workflowNodeTypeToRegistryType(dbType: string): string {
	return String(dbType).toUpperCase();
}

/**
 * Maps API workflow nodes to React Flow nodes.
 */
export function mapWorkflowNodesToFlow(nodes: workflow_node[]): Node[] {
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
 */
export function mapWorkflowEdgesToFlow(edges: workflow_edge[]): Edge[] {
	return edges.map((e) => ({
		id: e.id,
		source: e.source_node_id,
		target: e.target_node_id,
		sourceHandle: e.source_handle,
		targetHandle: e.target_handle,
	}));
}
