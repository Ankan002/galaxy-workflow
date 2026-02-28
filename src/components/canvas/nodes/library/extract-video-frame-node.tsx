"use client";

import { useCallback } from "react";
import { useReactFlow, type NodeProps } from "@xyflow/react";
import { Film } from "lucide-react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { useWorkflowNodePersistence } from "@/components/canvas/workflow-node-persistence-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ExtractVideoFrameNodeConfig {
	/** Timestamp: seconds (e.g. 10) or percentage (e.g. "50%"). Default 0. */
	timestamp?: number | string;
}

export const EXTRACT_VIDEO_FRAME_DEFINITION: Omit<
	NodeDefinition<ExtractVideoFrameNodeConfig>,
	"Component"
> = {
	type: NodeType.EXTRACT_VIDEO_FRAME,
	label: "Extract Frame from Video",
	description:
		"Extract a single frame from video via FFmpeg (Trigger.dev). Input: video_url (mp4, mov, webm, m4v), optional timestamp (seconds or e.g. 50%). Output: frame image URL (jpg/png, via Transloadit).",
	provider: "TRIGGER_DEV",
	inputHandles: [
		{ key: "video_url", type: "video", required: true },
		{ key: "timestamp", type: "string", required: false },
	],
	outputHandles: [{ key: "output", type: "string" }],
	defaultConfig: { timestamp: 0 },
};

export function ExtractVideoFrameNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const updateConfig = useUpdateNodeConfig(id);
	const { onNodeDetailsBlur } = useWorkflowNodePersistence();
	const config = (data?.config ??
		EXTRACT_VIDEO_FRAME_DEFINITION.defaultConfig) as ExtractVideoFrameNodeConfig;
	const status = data?.status as
		| "idle"
		| "running"
		| "completed"
		| "failed"
		| undefined;
	const timestamp = config.timestamp ?? 0;

	const setTimestamp = useCallback(
		(v: number | string) => updateConfig({ timestamp: v }),
		[updateConfig],
	);

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

	const displayValue =
		typeof timestamp === "string" ? timestamp : String(timestamp);

	return (
		<BaseNode
			id={id}
			label={EXTRACT_VIDEO_FRAME_DEFINITION.label}
			description={EXTRACT_VIDEO_FRAME_DEFINITION.description}
			status={status}
			inputHandles={EXTRACT_VIDEO_FRAME_DEFINITION.inputHandles}
			outputHandles={EXTRACT_VIDEO_FRAME_DEFINITION.outputHandles}
			selected={selected}
			icon={<Film className="size-4" />}
			isPulsating={data?.isPulsating as boolean | undefined}
		>
			<div className="space-y-2 nodrag nopan" onBlur={handleBlur}>
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">
						Timestamp (seconds or %, e.g. 10 or 50%)
					</Label>
					<Input
						value={displayValue}
						onChange={(e) => {
							const raw = e.target.value.trim();
							if (raw.endsWith("%")) {
								setTimestamp(raw);
							} else {
								const n = Number(raw);
								setTimestamp(Number.isFinite(n) ? n : raw || 0);
							}
						}}
						placeholder="0"
						className="h-7 text-xs"
					/>
				</div>
				<p className="text-[10px] text-muted-foreground">
					Output: extracted frame image URL (jpg or png, via
					Transloadit)
				</p>
			</div>
		</BaseNode>
	);
}
