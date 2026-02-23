"use client";

import { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { Textarea } from "@/components/ui/textarea";

export interface TextNodeConfig {
	text: string;
}

export const TEXT_DEFINITION: Omit<NodeDefinition<TextNodeConfig>, "Component"> = {
	type: NodeType.TEXT,
	label: "Text",
	description: "Simple text input with textarea. Output handle for text data.",
	provider: "INTERNAL",
	inputHandles: [],
	outputHandles: [{ key: "value", type: "string" }],
	defaultConfig: { text: "" },
};

export function TextNode({ id, data, selected }: NodeProps) {
	const updateConfig = useUpdateNodeConfig(id);
	const config = (data?.config ?? TEXT_DEFINITION.defaultConfig) as TextNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const text = config.text ?? "";

	const setText = useCallback(
		(value: string) => updateConfig({ text: value }),
		[updateConfig],
	);

	return (
		<BaseNode
			label={TEXT_DEFINITION.label}
			description={TEXT_DEFINITION.description}
			status={status}
			inputHandles={TEXT_DEFINITION.inputHandles}
			outputHandles={TEXT_DEFINITION.outputHandles}
			selected={selected}
		>
			<div className="space-y-1 nodrag nopan">
				<Textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
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
