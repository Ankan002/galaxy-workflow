"use client";

import { useCallback, useState } from "react";
import { Panel, useReactFlow, useViewport } from "@xyflow/react";
import {
	MousePointer2,
	Hand,
	Undo2,
	Redo2,
	ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ZOOM_PRESETS = [0.25, 0.5, 0.67, 1, 1.25, 1.5, 2];

export type InteractionMode = "select" | "pan";

interface CanvasBottomIslandProps {
	interactionMode: InteractionMode;
	onInteractionModeChange: (mode: InteractionMode) => void;
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

export function CanvasBottomIsland({
	interactionMode,
	onInteractionModeChange,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
}: CanvasBottomIslandProps) {
	const { setViewport } = useReactFlow();
	const { x, y, zoom } = useViewport();
	const [zoomOpen, setZoomOpen] = useState(false);

	const setZoom = useCallback(
		(z: number) => {
			setViewport({ x, y, zoom: z });
			setZoomOpen(false);
		},
		[setViewport, x, y],
	);

	const zoomPercent = Math.round(zoom * 100);

	return (
		<Panel position="bottom-center" className="mb-4">
			<div className="flex items-center gap-0 rounded-xl border border-border bg-card px-1 py-1 shadow-lg">
				{/* Select */}
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"size-9 rounded-lg",
						interactionMode === "select" &&
							"bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
					)}
					onClick={() => onInteractionModeChange("select")}
					title="Select"
				>
					<MousePointer2 className="size-4" />
				</Button>
				{/* Pan */}
				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"size-9 rounded-lg",
						interactionMode === "pan" &&
							"bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
					)}
					onClick={() => onInteractionModeChange("pan")}
					title="Pan"
				>
					<Hand className="size-4" />
				</Button>

				<div className="mx-1 h-6 w-px bg-border" />

				{/* Undo */}
				<Button
					variant="ghost"
					size="icon"
					className="size-9 rounded-lg"
					onClick={onUndo}
					disabled={!canUndo}
					title="Undo"
				>
					<Undo2 className="size-4" />
				</Button>
				{/* Redo */}
				<Button
					variant="ghost"
					size="icon"
					className="size-9 rounded-lg disabled:opacity-40"
					onClick={onRedo}
					disabled={!canRedo}
					title="Redo"
				>
					<Redo2 className="size-4" />
				</Button>

				<div className="mx-1 h-6 w-px bg-border" />

				{/* Zoom */}
				<DropdownMenu open={zoomOpen} onOpenChange={setZoomOpen}>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="gap-1 rounded-lg px-2 font-normal"
							title="Zoom"
						>
							<span className="min-w-10 text-right">{zoomPercent}%</span>
							<ChevronDown className="size-4 opacity-70" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="center" className="min-w-24">
						{ZOOM_PRESETS.map((z) => (
							<DropdownMenuItem
								key={z}
								onClick={() => setZoom(z)}
								className={cn(z === zoom && "bg-accent")}
							>
								{Math.round(z * 100)}%
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Panel>
	);
}
