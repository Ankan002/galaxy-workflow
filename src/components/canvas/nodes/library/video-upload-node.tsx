"use client";

import { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VideoIcon } from "lucide-react";

const ACCEPTED_VIDEO_EXTENSIONS = "mp4, mov, webm, m4v";
const DEFAULT_ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-m4v";

export interface VideoUploadNodeConfig {
	accept?: string;
	maxSizeMb?: number;
	/** Preview URL after upload (via Transloadit). Shown in video player preview. */
	previewUrl?: string;
}

export const VIDEO_UPLOAD_DEFINITION: Omit<
	NodeDefinition<VideoUploadNodeConfig>,
	"Component"
> = {
	type: NodeType.VIDEO_UPLOAD,
	label: "Upload Video",
	description: "Upload via Transloadit. Accepted: mp4, mov, webm, m4v. Output: video URL.",
	provider: "TRANSLOADIT",
	inputHandles: [],
	outputHandles: [
		{ key: "url", type: "string" },
		{ key: "video", type: "video" },
	],
	defaultConfig: { accept: DEFAULT_ACCEPT, maxSizeMb: 500 },
};

export function VideoUploadNode({ id, data, selected }: NodeProps) {
	const updateConfig = useUpdateNodeConfig(id);
	const config = (data?.config ?? VIDEO_UPLOAD_DEFINITION.defaultConfig) as VideoUploadNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const accept = config.accept ?? DEFAULT_ACCEPT;
	const maxSizeMb = config.maxSizeMb ?? 500;
	const previewUrl = config.previewUrl ?? "";

	const setAccept = useCallback(
		(v: string) => updateConfig({ accept: v || DEFAULT_ACCEPT }),
		[updateConfig],
	);
	const setMaxSizeMb = useCallback(
		(v: number) => updateConfig({ maxSizeMb: Math.max(0, v) }),
		[updateConfig],
	);
	const setPreviewUrl = useCallback(
		(v: string) => updateConfig({ previewUrl: v }),
		[updateConfig],
	);

	return (
		<BaseNode
			label={VIDEO_UPLOAD_DEFINITION.label}
			description={VIDEO_UPLOAD_DEFINITION.description}
			status={status}
			inputHandles={VIDEO_UPLOAD_DEFINITION.inputHandles}
			outputHandles={VIDEO_UPLOAD_DEFINITION.outputHandles}
			selected={selected}
		>
			<div className="space-y-2 nodrag nopan">
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">
						Accept ({ACCEPTED_VIDEO_EXTENSIONS})
					</Label>
					<Input
						value={accept}
						onChange={(e) => setAccept(e.target.value)}
						placeholder={DEFAULT_ACCEPT}
						className="h-7 text-xs"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">Max size (MB)</Label>
					<Input
						type="number"
						min={0}
						step={1}
						value={maxSizeMb}
						onChange={(e) => setMaxSizeMb(Number(e.target.value) || 0)}
						className="h-7 text-xs"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">Video player preview</Label>
					<div className="rounded-md border border-border bg-muted/30 aspect-video min-h-[80px] flex items-center justify-center overflow-hidden">
						{previewUrl ? (
							<video
								src={previewUrl}
								controls
								className="max-h-full w-full object-contain"
								playsInline
								preload="metadata"
							/>
						) : (
							<div className="flex flex-col items-center gap-1 text-muted-foreground">
								<VideoIcon className="size-8" />
								<span className="text-[10px]">Upload via Transloadit</span>
							</div>
						)}
					</div>
					<Input
						value={previewUrl}
						onChange={(e) => setPreviewUrl(e.target.value)}
						placeholder="Preview URL (e.g. after upload)"
						className="h-7 text-xs"
					/>
				</div>
				<p className="text-[10px] text-muted-foreground">Output: video URL</p>
			</div>
		</BaseNode>
	);
}
