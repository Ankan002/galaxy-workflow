"use client";

import { useCallback, useEffect } from "react";
import {
	useReactFlow,
	useUpdateNodeInternals,
	type NodeProps,
} from "@xyflow/react";
import { Plus, Minus } from "lucide-react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition, InputHandleDef } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { useWorkflowCanvasStore } from "@/store";
import { Button } from "@/components/ui";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
	ALLOWED_LLM_MODELS,
	DEFAULT_LLM_MODEL,
	getValidLlmModel,
} from "@/lib/execution/llm-models";

export const LLM_MODELS = ALLOWED_LLM_MODELS;
export type LLMModelId = (typeof LLM_MODELS)[number];

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

export const RUN_LLM_DEFINITION: Omit<
	NodeDefinition<RunLlmNodeConfig>,
	"Component"
> = {
	type: NodeType.RUN_LLM,
	label: "Run LLM",
	description: "Run a large language model",
	provider: "TRIGGER_DEV",
	inputHandles: [...STATIC_INPUT_HANDLES],
	outputHandles: [{ key: "response", type: "string" }],
	defaultConfig: {
		model: DEFAULT_LLM_MODEL,
		systemPrompt: "",
		temperature: 0.7,
		imageInputCount: 0,
	},
};

function buildInputHandles(imageCount: number): InputHandleDef[] {
	const imageHandles: InputHandleDef[] = Array.from(
		{ length: imageCount },
		(_, i) => ({
			key: `image_${i}`,
			type: "image" as const,
			required: false,
		}),
	);
	return [...STATIC_INPUT_HANDLES, ...imageHandles];
}

const clampImageCount = (n: number) => Math.max(0, Math.floor(Number(n)));

export function RunLlmNode({ id, data, selected }: NodeProps) {
	const { setNodes, setEdges, getNode } = useReactFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	const updateConfig = useUpdateNodeConfig(id);
	const { onNodeDetailsBlur } = useWorkflowCanvasStore();
	const config = (data?.config ??
		RUN_LLM_DEFINITION.defaultConfig) as RunLlmNodeConfig;
	const status = data?.status as
		| "idle"
		| "running"
		| "completed"
		| "failed"
		| undefined;
	const imageCount = clampImageCount(config.imageInputCount ?? 0);
	const inputHandles = buildInputHandles(imageCount);

	// Re-render handles and edges when image input count changes so order and connections map correctly
	useEffect(() => {
		updateNodeInternals(id);
	}, [id, imageCount, updateNodeInternals]);
	const temperature = Math.min(
		2,
		Math.max(0, Number(config.temperature) ?? 0.7),
	);
	const model = getValidLlmModel(config.model) as LLMModelId;

	const addImageInput = useCallback(() => {
		setNodes((nodes) =>
			nodes.map((n) =>
				n.id === id
					? {
							...n,
							data: {
								...n.data,
								config: {
									...(typeof n.data?.config === "object" &&
									n.data.config != null
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
									...(typeof n.data?.config === "object" &&
									n.data.config != null
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

	const handleBlur = useCallback(
		(e: React.FocusEvent) => {
			if (
				e.relatedTarget != null &&
				e.currentTarget.contains(e.relatedTarget as HTMLElement)
			)
				return;
			const node = getNode(id);
			if (!node) return;
			onNodeDetailsBlur(id, {
				config: (node.data?.config as Record<string, unknown>) ?? {},
				positionX: node.position.x,
				positionY: node.position.y,
			});
		},
		[id, getNode, onNodeDetailsBlur],
	);

	return (
		<BaseNode
			id={id}
			label={RUN_LLM_DEFINITION.label}
			description={RUN_LLM_DEFINITION.description}
			status={status}
			inputHandles={inputHandles}
			outputHandles={RUN_LLM_DEFINITION.outputHandles}
			selected={selected}
			isPulsating={data?.isPulsating as boolean | undefined}
		>
			<div className="space-y-2 nodrag nopan" onBlur={handleBlur}>
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">
						Model
					</Label>
					<Select
						value={model}
						onValueChange={(v) => {
							updateConfig({ model: v });
							const node = getNode(id);
							if (node) {
								onNodeDetailsBlur(id, {
									config: {
										...(typeof node.data?.config ===
											"object" &&
										node.data?.config != null
											? (node.data.config as Record<
													string,
													unknown
												>)
											: {}),
										model: v,
									},
									positionX: node.position.x,
									positionY: node.position.y,
								});
							}
						}}
					>
						<SelectTrigger className="h-7 text-xs">
							<SelectValue placeholder="Select model" />
						</SelectTrigger>
						<SelectContent>
							{LLM_MODELS.map((m) => (
								<SelectItem
									key={m}
									value={m}
									className="text-xs"
								>
									{m}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">
						Temperature: {Number(temperature).toFixed(1)}
					</Label>
					<Slider
						value={[temperature]}
						onValueChange={([v]) =>
							updateConfig({
								temperature: Math.min(2, Math.max(0, v ?? 0.7)),
							})
						}
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
