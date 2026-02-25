import { VALID_NODE_CONNECTIONS_SET } from "@/config/server-constants";
import type { WorkflowExportEdge, WorkflowExportNode, WorkflowExportPayload } from "./schema";
import { ApiError } from "@/types/errors/api-error";

/**
 * Validates an import payload: node ids unique, edges reference existing nodes,
 * and every edge connection type is allowed. Throws ApiError on failure.
 */
export function validateWorkflowImportPayload(payload: WorkflowExportPayload): void {
	const nodeIds = new Set(payload.nodes.map((n) => n.id));
	if (nodeIds.size !== payload.nodes.length) {
		throw new ApiError("Duplicate node id in workflow export", 400);
	}

	const nodeById = new Map<string, WorkflowExportNode>();
	for (const n of payload.nodes) {
		nodeById.set(n.id, n);
	}

	const seenEdges = new Set<string>();
	for (const e of payload.edges) {
		if (!nodeById.has(e.source_node_id)) {
			throw new ApiError(
				`Edge references missing source node "${e.source_node_id}"`,
				400,
			);
		}
		if (!nodeById.has(e.target_node_id)) {
			throw new ApiError(
				`Edge references missing target node "${e.target_node_id}"`,
				400,
			);
		}
		if (e.source_node_id === e.target_node_id) {
			throw new ApiError("Edge cannot connect a node to itself", 400);
		}
		const sourceNode = nodeById.get(e.source_node_id)!;
		const targetNode = nodeById.get(e.target_node_id)!;
		const connection = `${sourceNode.type}-${targetNode.type}`;
		if (!VALID_NODE_CONNECTIONS_SET.has(connection)) {
			throw new ApiError(
				`Invalid connection in import: ${sourceNode.type} → ${targetNode.type} is not allowed`,
				400,
			);
		}
		const edgeKey = `${e.source_node_id}:${e.target_node_id}:${e.source_handle}:${e.target_handle}`;
		if (seenEdges.has(edgeKey)) {
			throw new ApiError("Duplicate edge in workflow export", 400);
		}
		seenEdges.add(edgeKey);
	}
}
