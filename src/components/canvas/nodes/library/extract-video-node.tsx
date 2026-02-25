"use client";

import { useCallback } from "react";
import { useReactFlow, type NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { useWorkflowNodePersistence } from "@/components/canvas/workflow-node-persistence-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ExtractVideoNodeConfig {
	startSeconds?: number;
	endSeconds?: number;
	format?: string;
}

export const EXTRACT_VIDEO_DEFINITION: Omit<
	NodeDefinition<ExtractVideoNodeConfig>,
	"Component"
> = {
	type: NodeType.EXTRACT_VIDEO,
	label: "Extract Video",
	description: "Extract a segment from a video",
	provider: "TRANSLOADIT",
	inputHandles: [{ key: "video", type: "video", required: true }],
	outputHandles: [
		{ key: "video", type: "video" },
		{ key: "url", type: "string" },
	],
	defaultConfig: { startSeconds: 0, endSeconds: 0, format: "mp4" },
};

export function ExtractVideoNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const updateConfig = useUpdateNodeConfig(id);
	const { onNodeDetailsBlur } = useWorkflowNodePersistence();
	const config = (data?.config ?? EXTRACT_VIDEO_DEFINITION.defaultConfig) as ExtractVideoNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const startSeconds = config.startSeconds ?? 0;
	const endSeconds = config.endSeconds ?? 0;
	const format = config.format ?? "mp4";

	const setStartSeconds = useCallback(
		(v: number) => updateConfig({ startSeconds: Math.max(0, v) }),
		[updateConfig],
	);
	const setEndSeconds = useCallback(
		(v: number) => updateConfig({ endSeconds: Math.max(0, v) }),
		[updateConfig],
	);
	const setFormat = useCallback(
		(v: string) => updateConfig({ format: v || "mp4" }),
		[updateConfig],
	);

	const handleBlur = useCallback(
		(e: React.FocusEvent) => {
			if (e.relatedTarget != null && e.currentTarget.contains(e.relatedTarget as HTMLElement)) return;
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
			label={EXTRACT_VIDEO_DEFINITION.label}
			description={EXTRACT_VIDEO_DEFINITION.description}
			status={status}
			inputHandles={EXTRACT_VIDEO_DEFINITION.inputHandles}
			outputHandles={EXTRACT_VIDEO_DEFINITION.outputHandles}
			selected={selected}
			isPulsating={data?.isPulsating}
		>
			<div className="space-y-2 nodrag nopan" onBlur={handleBlur}>
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-1">
						<Label className="text-[10px] text-muted-foreground">Start (s)</Label>
						<Input
							type="number"
							min={0}
							step={0.1}
							value={startSeconds}
							onChange={(e) => setStartSeconds(Number(e.target.value) || 0)}
							className="h-7 text-xs"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-[10px] text-muted-foreground">End (s)</Label>
						<Input
							type="number"
							min={0}
							step={0.1}
							value={endSeconds}
							onChange={(e) => setEndSeconds(Number(e.target.value) || 0)}
							className="h-7 text-xs"
						/>
					</div>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">Format</Label>
					<Input
						value={format}
						onChange={(e) => setFormat(e.target.value)}
						placeholder="mp4"
						className="h-7 text-xs"
					/>
				</div>
			</div>
		</BaseNode>
	);
}
