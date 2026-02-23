"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";

/**
 * Returns a function to update the config of the current node by id.
 * Use for dynamic UI controls that edit node config (nodrag nopan on controls).
 */
export function useUpdateNodeConfig(nodeId: string) {
	const { setNodes } = useReactFlow();

	return useCallback(
		(patch: Record<string, unknown>) => {
			setNodes((nodes) =>
				nodes.map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									config: {
										...(typeof n.data?.config === "object" && n.data.config != null
											? (n.data.config as Record<string, unknown>)
											: {}),
										...patch,
									},
								},
							}
						: n,
				),
			);
		},
		[nodeId, setNodes],
	);
}
