"use client";

import { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { NodeType } from "../registry/types";
import { BaseNode } from "../base-node";
import type { NodeDefinition } from "../registry/types";
import { useUpdateNodeConfig } from "../use-update-node-config";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export interface CropImageNodeConfig {
	x_percent?: number;
	y_percent?: number;
	width_percent?: number;
	height_percent?: number;
}

export const CROP_IMAGE_DEFINITION: Omit<NodeDefinition<CropImageNodeConfig>, "Component"> = {
	type: NodeType.CROP_IMAGE,
	label: "Crop Image",
	description: "Crop an image by percentage region (jpg, jpeg, png, webp, gif)",
	provider: "TRANSLOADIT",
	inputHandles: [{ key: "image_url", type: "image", required: true }],
	outputHandles: [{ key: "image", type: "image" }],
	defaultConfig: {
		x_percent: 0,
		y_percent: 0,
		width_percent: 100,
		height_percent: 100,
	},
};

function clampPercent(v: number): number {
	return Math.min(100, Math.max(0, v));
}

export function CropImageNode({ id, data, selected }: NodeProps) {
	const updateConfig = useUpdateNodeConfig(id);
	const config = (data?.config ?? CROP_IMAGE_DEFINITION.defaultConfig) as CropImageNodeConfig;
	const status = data?.status as "idle" | "running" | "completed" | "failed" | undefined;
	const x = config.x_percent ?? 0;
	const y = config.y_percent ?? 0;
	const w = config.width_percent ?? 100;
	const h = config.height_percent ?? 100;

	const setX = useCallback(
		(v: number) => updateConfig({ x_percent: clampPercent(v) }),
		[updateConfig],
	);
	const setY = useCallback(
		(v: number) => updateConfig({ y_percent: clampPercent(v) }),
		[updateConfig],
	);
	const setW = useCallback(
		(v: number) => updateConfig({ width_percent: clampPercent(v) }),
		[updateConfig],
	);
	const setH = useCallback(
		(v: number) => updateConfig({ height_percent: clampPercent(v) }),
		[updateConfig],
	);

	return (
		<BaseNode
			label={CROP_IMAGE_DEFINITION.label}
			description={CROP_IMAGE_DEFINITION.description}
			status={status}
			inputHandles={CROP_IMAGE_DEFINITION.inputHandles}
			outputHandles={CROP_IMAGE_DEFINITION.outputHandles}
			selected={selected}
		>
			<div className="space-y-2 nodrag nopan">
				<div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
					<div className="space-y-0.5">
						<Label className="text-[10px] text-muted-foreground">X %</Label>
						<div className="flex items-center gap-1">
							<Slider
								value={[x]}
								onValueChange={([v]) => setX(v ?? 0)}
								min={0}
								max={100}
								step={1}
								className="flex-1"
							/>
							<Input
								type="number"
								min={0}
								max={100}
								value={x}
								onChange={(e) => setX(Number(e.target.value) || 0)}
								className="h-6 w-10 shrink-0 px-1 text-center text-[10px]"
							/>
						</div>
					</div>
					<div className="space-y-0.5">
						<Label className="text-[10px] text-muted-foreground">Y %</Label>
						<div className="flex items-center gap-1">
							<Slider
								value={[y]}
								onValueChange={([v]) => setY(v ?? 0)}
								min={0}
								max={100}
								step={1}
								className="flex-1"
							/>
							<Input
								type="number"
								min={0}
								max={100}
								value={y}
								onChange={(e) => setY(Number(e.target.value) || 0)}
								className="h-6 w-10 shrink-0 px-1 text-center text-[10px]"
							/>
						</div>
					</div>
					<div className="space-y-0.5 col-span-2">
						<Label className="text-[10px] text-muted-foreground">Width %</Label>
						<div className="flex items-center gap-1">
							<Slider
								value={[w]}
								onValueChange={([v]) => setW(v ?? 100)}
								min={0}
								max={100}
								step={1}
								className="flex-1"
							/>
							<Input
								type="number"
								min={0}
								max={100}
								value={w}
								onChange={(e) => setW(Number(e.target.value) ?? 100)}
								className="h-6 w-10 shrink-0 px-1 text-center text-[10px]"
							/>
						</div>
					</div>
					<div className="space-y-0.5 col-span-2">
						<Label className="text-[10px] text-muted-foreground">Height %</Label>
						<div className="flex items-center gap-1">
							<Slider
								value={[h]}
								onValueChange={([v]) => setH(v ?? 100)}
								min={0}
								max={100}
								step={1}
								className="flex-1"
							/>
							<Input
								type="number"
								min={0}
								max={100}
								value={h}
								onChange={(e) => setH(Number(e.target.value) ?? 100)}
								className="h-6 w-10 shrink-0 px-1 text-center text-[10px]"
							/>
						</div>
					</div>
				</div>
				<p className="text-[10px] text-muted-foreground opacity-80">
					Output: image (URL)
				</p>
			</div>
		</BaseNode>
	);
}
