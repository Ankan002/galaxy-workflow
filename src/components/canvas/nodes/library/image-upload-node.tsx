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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const ACCEPT_TYPES = DEFAULT_ACCEPT.split(",").map((s) => s.trim());

function isAcceptedImageType(type: string): boolean {
	return ACCEPT_TYPES.includes(type) || type.startsWith("image/");
}

export interface ImageUploadNodeConfig {
	/** Preview URL after upload (via Transloadit). Shown in image preview. */
	previewUrl?: string;
}

export const IMAGE_UPLOAD_DEFINITION: Omit<
	NodeDefinition<ImageUploadNodeConfig>,
	"Component"
> = {
	type: NodeType.IMAGE_UPLOAD,
	label: "Upload Image",
	description: "Upload via Transloadit. Accepted: jpg, png, webp, gif. Output: image URL.",
	provider: "TRANSLOADIT",
	inputHandles: [],
	outputHandles: [{ key: "image", type: "image" }],
	defaultConfig: {},
};

export function ImageUploadNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const workflowId = useWorkflowId();
	const updateConfig = useUpdateNodeConfig(id);
	const { onNodeDetailsBlur } = useWorkflowNodePersistence();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const config = (data?.config ?? IMAGE_UPLOAD_DEFINITION.defaultConfig) as ImageUploadNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const previewUrl = config.previewUrl ?? "";

	const { uploadFile, isUploading, progressPercent, error } = useTransloaditUpload({
		workflowId: workflowId ?? "",
		nodeId: id,
		type: "image",
		onSuccess: (url) => updateConfig({ previewUrl: url }),
	});

	const setPreviewUrl = useCallback(
		(v: string) => updateConfig({ previewUrl: v }),
		[updateConfig],
	);

	const startUpload = useCallback(
		(file: File) => {
			if (!workflowId || isUploading) return;
			if (!isAcceptedImageType(file.type)) return;
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
			label={IMAGE_UPLOAD_DEFINITION.label}
			description={IMAGE_UPLOAD_DEFINITION.description}
			status={status}
			inputHandles={IMAGE_UPLOAD_DEFINITION.inputHandles}
			outputHandles={IMAGE_UPLOAD_DEFINITION.outputHandles}
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
							"rounded-md border border-border bg-muted/30 aspect-video min-h-[80px] flex items-center justify-center overflow-hidden cursor-pointer transition-colors",
							workflowId && !isUploading && "hover:bg-muted/50",
							isDragOver && "ring-2 ring-primary bg-muted/50",
						)}
						aria-label="Click or drop image to upload"
					>
						{previewUrl ? (
							// eslint-disable-next-line @next/next/no-img-element -- Transloadit URLs are dynamic; next/image requires config
							<img
								src={previewUrl}
								alt="Upload preview"
								className="max-h-full w-full object-contain pointer-events-none"
							/>
						) : (
							<div className="flex flex-col items-center gap-1 text-muted-foreground pointer-events-none">
								<ImageIcon className="size-8" />
								<span className="text-[10px]">
									{isDragOver ? "Drop image here" : "Click or drop image"}
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
				<p className="text-[10px] text-muted-foreground">Output: image (URL)</p>
			</div>
		</BaseNode>
	);
}
