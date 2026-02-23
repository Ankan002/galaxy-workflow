"use client";

import { useCallback } from "react";
import { useReactFlow, type NodeProps } from "@xyflow/react";
import { Plus, Minus } from "lucide-react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition, InputHandleDef } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export interface RunLlmNodeConfig {
	model?: string;
	systemPrompt?: string;
	temperature?: number;
	imageInputCount?: number;
}

const STATIC_INPUT_HANDLES: InputHandleDef[] = [
	{ key: "systemPrompt", type: "string", required: false },
	{ key: "userMessages", type: "string", required: false },
];

export const RUN_LLM_DEFINITION: Omit<NodeDefinition<RunLlmNodeConfig>, "Component"> = {
	type: NodeType.RUN_LLM,
	label: "Run LLM",
	description: "Run a large language model",
	provider: "TRIGGER_DEV",
	inputHandles: [
		...STATIC_INPUT_HANDLES,
		{ key: "image_0", type: "image", required: false },
	],
	outputHandles: [{ key: "response", type: "string" }],
	defaultConfig: { model: "gpt-4o", systemPrompt: "", temperature: 0.7, imageInputCount: 0 },
};

function buildInputHandles(imageCount: number): InputHandleDef[] {
	const imageHandles: InputHandleDef[] = Array.from(
		{ length: imageCount },
		(_, i) => ({ key: `image_${i}`, type: "image" as const, required: false }),
	);
	return [...STATIC_INPUT_HANDLES, ...imageHandles];
}

export function RunLlmNode({ id, data, selected }: NodeProps) {
	const { setNodes, setEdges } = useReactFlow();
	const updateConfig = useUpdateNodeConfig(id);
	const config = (data?.config ?? RUN_LLM_DEFINITION.defaultConfig) as RunLlmNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const imageCount = config.imageInputCount ?? 0;
	const inputHandles = buildInputHandles(imageCount);
	const temperature = config.temperature ?? 0.7;
	const model = config.model ?? "gpt-4o";

	const addImageInput = useCallback(() => {
		setNodes((nodes) =>
			nodes.map((n) =>
				n.id === id
					? {
							...n,
							data: {
								...n.data,
								config: {
									...(typeof n.data?.config === "object" && n.data.config != null
										? n.data.config
										: {}),
									imageInputCount: imageCount + 1,
								},
							},
						}
					: n,
			),
		);
	}, [id, imageCount, setNodes]);

	const removeImageInput = useCallback(() => {
		if (imageCount <= 0) return;
		const lastHandle = `image_${imageCount - 1}`;
		setEdges((edges) =>
			edges.filter(
				(e) => !(e.target === id && e.targetHandle === lastHandle),
			),
		);
		setNodes((nodes) =>
			nodes.map((n) =>
				n.id === id
					? {
							...n,
							data: {
								...n.data,
								config: {
									...(typeof n.data?.config === "object" && n.data.config != null
										? n.data.config
										: {}),
									imageInputCount: imageCount - 1,
								},
							},
						}
					: n,
			),
		);
	}, [id, imageCount, setNodes, setEdges]);

	return (
		<BaseNode
			label={RUN_LLM_DEFINITION.label}
			description={RUN_LLM_DEFINITION.description}
			status={status}
			inputHandles={inputHandles}
			outputHandles={RUN_LLM_DEFINITION.outputHandles}
			selected={selected}
		>
			<div className="space-y-2 nodrag nopan">
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">Model</Label>
					<Input
						value={model}
						onChange={(e) => updateConfig({ model: e.target.value })}
						placeholder="gpt-4o"
						className="h-7 text-xs"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">
						Temperature: {temperature}
					</Label>
					<Slider
						value={[temperature]}
						onValueChange={([v]) => updateConfig({ temperature: v ?? 0.7 })}
						min={0}
						max={2}
						step={0.1}
					/>
				</div>
				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						className="h-6 w-6"
						onClick={addImageInput}
						title="Add image input"
					>
						<Plus className="size-3" />
					</Button>
					{imageCount > 0 && (
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							className="h-6 w-6"
							onClick={removeImageInput}
							title="Remove image input"
						>
							<Minus className="size-3" />
						</Button>
					)}
					<span className="text-[10px] text-muted-foreground">
						{imageCount} image{imageCount !== 1 ? "s" : ""}
					</span>
				</div>
			</div>
		</BaseNode>
	);
}
