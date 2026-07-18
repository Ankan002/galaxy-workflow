"use client";

import { useCallback, useState } from "react";
import { useReactFlow, type NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";

import { useWorkflowCanvasStore } from "@/store";
import { FilePickerDialog } from "@/components/gallery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoUploadNodeConfig {
	/** Public S3 URL of the selected video. Consumed by downstream nodes. */
	previewUrl?: string;
	/** Mirror of previewUrl (full-flow execution reads url as fallback). */
	url?: string;
	/** Gallery item the video came from (for reference/persistence). */
	galleryItemId?: string;
	/** S3 object key of the selected video. */
	key?: string;
}

export const VIDEO_UPLOAD_DEFINITION: Omit<
	NodeDefinition<VideoUploadNodeConfig>,
	"Component"
> = {
	type: NodeType.VIDEO_UPLOAD,
	label: "Upload Video",
	description:
		"Pick from your gallery or upload a new video. Accepted: mp4, mov, webm, m4v. Output: video URL.",
	provider: "INTERNAL",
	inputHandles: [],
	outputHandles: [{ key: "url", type: "string" }],
	defaultConfig: {},
};

export function VideoUploadNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const { workflowId, onNodeDetailsBlur } = useWorkflowCanvasStore();
	const updateConfig = useUpdateNodeConfig(id);

	const [pickerOpen, setPickerOpen] = useState(false);
	const config = (data?.config ??
		VIDEO_UPLOAD_DEFINITION.defaultConfig) as VideoUploadNodeConfig;
	const status = data?.status as
		| "idle"
		| "running"
		| "completed"
		| "failed"
		| undefined;
	const previewUrl = config.previewUrl ?? "";

	const setPreviewUrl = useCallback(
		(v: string) => updateConfig({ previewUrl: v, url: v }),
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

	return (
		<BaseNode
			id={id}
			label={VIDEO_UPLOAD_DEFINITION.label}
			description={VIDEO_UPLOAD_DEFINITION.description}
			status={status}
			inputHandles={VIDEO_UPLOAD_DEFINITION.inputHandles}
			outputHandles={VIDEO_UPLOAD_DEFINITION.outputHandles}
			selected={selected}
			isPulsating={data?.isPulsating as boolean | undefined}
		>
			<div className="space-y-2 nodrag nopan" onBlur={handleBlur}>
				<div className="space-y-1">
					<div
						role="button"
						tabIndex={0}
						onClick={() => workflowId && setPickerOpen(true)}
						onKeyDown={(e) => {
							if (
								(e.key === "Enter" || e.key === " ") &&
								workflowId
							) {
								e.preventDefault();
								setPickerOpen(true);
							}
						}}
						className={cn(
							"relative aspect-video min-h-[120px] flex items-center justify-center overflow-hidden cursor-pointer rounded-xl border border-border/80 bg-muted/30 transition-[border-color,box-shadow] duration-150 [transition-timing-function:var(--ease-snap)]",
							workflowId && "hover:border-ring/40 hover:shadow-md",
							previewUrl && "shadow-lg",
						)}
						aria-label="Choose or upload a video"
					>
						{previewUrl ? (
							<>
								<div
									className="absolute inset-0 bg-ink"
									aria-hidden
								/>
								<video
									src={previewUrl}
									controls
									className="relative z-10 max-h-full w-full object-contain rounded-lg"
									playsInline
									preload="metadata"
									onClick={(e) => e.stopPropagation()}
								/>
								{workflowId && (
									<Button
										type="button"
										variant="secondary"
										size="sm"
										className="absolute bottom-2 right-2 z-20 h-7 gap-1 px-2 text-[10px] shadow-md"
										onClick={(e) => {
											e.stopPropagation();
											setPickerOpen(true);
										}}
										aria-label="Choose another video"
									>
										<Upload className="size-3" />
										Change
									</Button>
								)}
							</>
						) : (
							<div className="flex flex-col items-center gap-1 text-muted-foreground pointer-events-none">
								<VideoIcon className="size-8" />
								<span className="text-[10px]">
									Pick or upload video
								</span>
							</div>
						)}
					</div>
					<Input
						value={previewUrl}
						onChange={(e) => setPreviewUrl(e.target.value)}
						placeholder="Video URL"
						className="h-7 text-xs"
					/>
				</div>
				<p className="text-[10px] text-muted-foreground">
					Output: video URL
				</p>
			</div>

			<FilePickerDialog
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				filterType="video"
				title="Choose a video"
				onSelect={(item) =>
					updateConfig({
						previewUrl: item.url,
						url: item.url,
						galleryItemId: item.id,
						key: item.key,
					})
				}
			/>
		</BaseNode>
	);
}
