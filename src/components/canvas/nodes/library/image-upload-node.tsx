"use client";

import { useCallback, useState } from "react";
import { useReactFlow, type NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";

import { useWorkflowCanvasStore } from "@/store";
import { FilePickerDialog } from "@/components/gallery";
import { Input } from "@/components/ui/input";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageUploadNodeConfig {
	/** Public S3 URL of the selected image. Consumed by downstream nodes. */
	previewUrl?: string;
	/** Mirror of previewUrl (full-flow execution reads url as fallback). */
	url?: string;
	/** Gallery item the image came from (for reference/persistence). */
	galleryItemId?: string;
	/** S3 object key of the selected image. */
	key?: string;
}

export const IMAGE_UPLOAD_DEFINITION: Omit<
	NodeDefinition<ImageUploadNodeConfig>,
	"Component"
> = {
	type: NodeType.IMAGE_UPLOAD,
	label: "Upload Image",
	description:
		"Pick from your gallery or upload a new image. Accepted: jpg, png, webp, gif. Output: image URL.",
	provider: "INTERNAL",
	inputHandles: [],
	outputHandles: [{ key: "image", type: "image" }],
	defaultConfig: {},
};

export function ImageUploadNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const { workflowId, onNodeDetailsBlur } = useWorkflowCanvasStore();
	const updateConfig = useUpdateNodeConfig(id);

	const [pickerOpen, setPickerOpen] = useState(false);
	const config = (data?.config ??
		IMAGE_UPLOAD_DEFINITION.defaultConfig) as ImageUploadNodeConfig;
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
			label={IMAGE_UPLOAD_DEFINITION.label}
			description={IMAGE_UPLOAD_DEFINITION.description}
			status={status}
			inputHandles={IMAGE_UPLOAD_DEFINITION.inputHandles}
			outputHandles={IMAGE_UPLOAD_DEFINITION.outputHandles}
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
							"rounded-md border border-border bg-muted/30 aspect-video min-h-[80px] flex items-center justify-center overflow-hidden cursor-pointer transition-colors",
							workflowId && "hover:bg-muted/50",
						)}
						aria-label="Choose or upload an image"
					>
						{previewUrl ? (
							// eslint-disable-next-line @next/next/no-img-element -- S3 URLs are dynamic; next/image requires config
							<img
								src={previewUrl}
								alt="Upload preview"
								className="max-h-full w-full object-contain pointer-events-none"
							/>
						) : (
							<div className="flex flex-col items-center gap-1 text-muted-foreground pointer-events-none">
								<ImageIcon className="size-8" />
								<span className="text-[10px]">
									Pick or upload image
								</span>
							</div>
						)}
					</div>
					<Input
						value={previewUrl}
						onChange={(e) => setPreviewUrl(e.target.value)}
						placeholder="Image URL"
						className="h-7 text-xs"
					/>
				</div>
				<p className="text-[10px] text-muted-foreground">
					Output: image (URL)
				</p>
			</div>

			<FilePickerDialog
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				filterType="image"
				title="Choose an image"
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
