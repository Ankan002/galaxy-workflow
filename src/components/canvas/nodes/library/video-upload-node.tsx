"use client";

import { useCallback, useRef, useState } from "react";
import { useReactFlow, type NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { useWorkflowNodePersistence } from "@/components/canvas/workflow-node-persistence-context";
import { useWorkflowId } from "@/components/canvas/workflow-id-context";
import { useTransloaditUpload } from "@/hooks/use-transloadit-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { VideoIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-m4v";
const ACCEPT_TYPES = DEFAULT_ACCEPT.split(",").map((s) => s.trim());

function isAcceptedVideoType(type: string): boolean {
	return ACCEPT_TYPES.some((a) => type === a || type.startsWith("video/"));
}

export interface VideoUploadNodeConfig {
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
	outputHandles: [{ key: "url", type: "string" }],
	defaultConfig: {},
};

export function VideoUploadNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const workflowId = useWorkflowId();
	const updateConfig = useUpdateNodeConfig(id);
	const { onNodeDetailsBlur } = useWorkflowNodePersistence();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const config = (data?.config ?? VIDEO_UPLOAD_DEFINITION.defaultConfig) as VideoUploadNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const previewUrl = config.previewUrl ?? "";

	const { uploadFile, isUploading, progressPercent, error } = useTransloaditUpload({
		workflowId: workflowId ?? "",
		nodeId: id,
		type: "video",
		onSuccess: (url) => updateConfig({ previewUrl: url }),
	});

	const setPreviewUrl = useCallback(
		(v: string) => updateConfig({ previewUrl: v }),
		[updateConfig],
	);

	const startUpload = useCallback(
		(file: File) => {
			if (!workflowId || isUploading) return;
			if (!isAcceptedVideoType(file.type)) return;
			uploadFile(file);
		},
		[workflowId, isUploading, uploadFile],
	);

	const onFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) startUpload(file);
			e.target.value = "";
		},
		[startUpload],
	);

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);
			const file = e.dataTransfer.files?.[0];
			if (file) startUpload(file);
		},
		[startUpload],
	);

	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}, []);

	const onDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	}, []);

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
			label={VIDEO_UPLOAD_DEFINITION.label}
			description={VIDEO_UPLOAD_DEFINITION.description}
			status={status}
			inputHandles={VIDEO_UPLOAD_DEFINITION.inputHandles}
			outputHandles={VIDEO_UPLOAD_DEFINITION.outputHandles}
			selected={selected}
		>
			<div className="space-y-2 nodrag nopan" onBlur={handleBlur}>
				<div className="space-y-1">
					{workflowId ? (
						<input
							ref={fileInputRef}
							type="file"
							accept={DEFAULT_ACCEPT}
							onChange={onFileChange}
							className="hidden"
							disabled={isUploading}
						/>
					) : null}
					<div
						role="button"
						tabIndex={0}
						onClick={() => workflowId && !isUploading && fileInputRef.current?.click()}
						onKeyDown={(e) => {
							if ((e.key === "Enter" || e.key === " ") && workflowId && !isUploading) {
								e.preventDefault();
								fileInputRef.current?.click();
							}
						}}
						onDrop={onDrop}
						onDragOver={onDragOver}
						onDragLeave={onDragLeave}
						className={cn(
							"relative aspect-video min-h-[120px] flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 rounded-xl border border-border/80 bg-neutral-950 shadow-inner",
							workflowId && !isUploading && "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
							isDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary/60 scale-[1.01]",
							previewUrl && "shadow-lg",
						)}
						aria-label="Click or drop video to upload"
					>
						{previewUrl ? (
							<>
								<div className="absolute inset-0 bg-neutral-950" aria-hidden />
								<video
									src={previewUrl}
									controls
									className="relative z-10 max-h-full w-full object-contain rounded-lg"
									playsInline
									preload="metadata"
									onClick={(e) => e.stopPropagation()}
								/>
								{workflowId && !isUploading && (
									<Button
										type="button"
										variant="secondary"
										size="sm"
										className="absolute bottom-2 right-2 z-20 h-7 gap-1 px-2 text-[10px] shadow-md"
										onClick={(e) => {
											e.stopPropagation();
											fileInputRef.current?.click();
										}}
										aria-label="Upload new video"
									>
										<Upload className="size-3" />
										Upload new
									</Button>
								)}
							</>
						) : (
							<div className="flex flex-col items-center gap-2 text-muted-foreground pointer-events-none">
								<div className="rounded-full bg-neutral-800/80 p-3 ring-1 ring-neutral-700/50">
									<VideoIcon className="size-7 text-neutral-400" />
								</div>
								<span className="text-[11px] font-medium text-neutral-400">
									{isDragOver ? "Drop video here" : "Click or drop video"}
								</span>
							</div>
						)}
					</div>
					{isUploading && (
						<Progress value={progressPercent} className="h-1.5" />
					)}
					{error && (
						<p className="text-[10px] text-destructive">{error.message}</p>
					)}
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
