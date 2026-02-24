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
import { ImageIcon } from "lucide-react";

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export interface ImageUploadNodeConfig {
	accept?: string;
	maxSizeMb?: number;
	/** Preview URL after upload (via Transloadit). Shown in image preview. */
	previewUrl?: string;
}

export const IMAGE_UPLOAD_DEFINITION: Omit<
	NodeDefinition<ImageUploadNodeConfig>,
	"Component"
> = {
	type: NodeType.IMAGE_UPLOAD,
	label: "Upload Image",
	description: "Upload via Transloadit. Accepted: jpg, jpeg, png, webp, gif. Output: image URL.",
	provider: "TRANSLOADIT",
	inputHandles: [],
	outputHandles: [{ key: "image", type: "image" }],
	defaultConfig: { accept: DEFAULT_ACCEPT, maxSizeMb: 10 },
};

export function ImageUploadNode({ id, data, selected }: NodeProps) {
	const { getNode } = useReactFlow();
	const updateConfig = useUpdateNodeConfig(id);
	const { onNodeDetailsBlur } = useWorkflowNodePersistence();
	const config = (data?.config ?? IMAGE_UPLOAD_DEFINITION.defaultConfig) as ImageUploadNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const maxSizeMb = config.maxSizeMb ?? 10;
	const previewUrl = config.previewUrl ?? "";

	const setMaxSizeMb = useCallback(
		(v: number) => updateConfig({ maxSizeMb: Math.max(0, v) }),
		[updateConfig],
	);
	const setPreviewUrl = useCallback(
		(v: string) => updateConfig({ previewUrl: v }),
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
			label={IMAGE_UPLOAD_DEFINITION.label}
			description={IMAGE_UPLOAD_DEFINITION.description}
			status={status}
			inputHandles={IMAGE_UPLOAD_DEFINITION.inputHandles}
			outputHandles={IMAGE_UPLOAD_DEFINITION.outputHandles}
			selected={selected}
		>
			<div className="space-y-2 nodrag nopan" onBlur={handleBlur}>
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
					<Label className="text-[10px] text-muted-foreground">Image preview</Label>
					<div className="rounded-md border border-border bg-muted/30 aspect-video min-h-[80px] flex items-center justify-center overflow-hidden">
						{previewUrl ? (
							// eslint-disable-next-line @next/next/no-img-element -- Transloadit URLs are dynamic; next/image requires config
							<img
								src={previewUrl}
								alt="Upload preview"
								className="max-h-full w-full object-contain"
							/>
						) : (
							<div className="flex flex-col items-center gap-1 text-muted-foreground">
								<ImageIcon className="size-8" />
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
				<p className="text-[10px] text-muted-foreground">Output: image (URL)</p>
			</div>
		</BaseNode>
	);
}
