"use client";

import { useCallback } from "react";
import { useReactFlow, type NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { useWorkflowNodePersistence } from "@/components/canvas/workflow-node-persistence-context";
import { Textarea } from "@/components/ui/textarea";

export interface TextNodeConfig {
	value: string;
}

export const TEXT_DEFINITION: Omit<NodeDefinition<TextNodeConfig>, "Component"> = {
	type: NodeType.TEXT,
	label: "Text",
	description: "Simple text input with textarea. Output handle for text data.",
	provider: "INTERNAL",
	inputHandles: [],
	outputHandles: [{ key: "value", type: "string" }],
	defaultConfig: { value: "" },
};

export function TextNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const updateConfig = useUpdateNodeConfig(id);
	const { onNodeDetailsBlur } = useWorkflowNodePersistence();
	const config = (data?.config ?? TEXT_DEFINITION.defaultConfig) as TextNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const value = config.value ?? "";

	const setValue = useCallback(
		(newValue: string) => updateConfig({ value: newValue }),
		[updateConfig],
	);

	const handleBlur = useCallback(() => {
		const node = getNode(id);
		if (!node) return;
		onNodeDetailsBlur(id, {
			config: (node.data?.config as Record<string, unknown>) ?? {},
			positionX: node.position.x,
			positionY: node.position.y,
		});
	}, [id, getNode, onNodeDetailsBlur]);

	return (
		<BaseNode
			label={TEXT_DEFINITION.label}
			description={TEXT_DEFINITION.description}
			status={status}
			inputHandles={TEXT_DEFINITION.inputHandles}
			outputHandles={TEXT_DEFINITION.outputHandles}
			selected={selected}
			isPulsating={data?.isPulsating}
		>
			<div className="space-y-1 nodrag nopan">
				<Textarea
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onBlur={handleBlur}
					placeholder="Enter text…"
					className="min-h-[60px] resize-y text-xs"
					rows={2}
				/>
				<p className="text-[10px] text-muted-foreground">
					Output: text data (connect to LLM or other nodes)
				</p>
			</div>
		</BaseNode>
	);
}
