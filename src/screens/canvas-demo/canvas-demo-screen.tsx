"use client";

import { Position, type Node, type Edge } from "@xyflow/react";
import {
	MessageSquare,
	ImageIcon,
	Sparkles,
	Blend,
	SlidersHorizontal,
} from "lucide-react";
import {
	WorkflowCanvas,
	useWorkflowCanvas,
	type BaseNodeData,
	type BaseEdgeData,
} from "@/components/canvas";

const demoNodes: Node[] = [
	{
		id: "prompt-1",
		type: "base",
		position: { x: 80, y: 0 },
		data: {
			label: "Text Prompt",
			description: "Describe the scene",
			icon: <MessageSquare className="size-4" />,
			badge: "prompt",
			badgeVariant: "connection-prompt",
			status: "success",
		} satisfies BaseNodeData,
	},
	{
		id: "style-1",
		type: "base",
		position: { x: 440, y: 0 },
		data: {
			label: "Style Preset",
			description: "Cinematic, 4K, dramatic lighting",
			icon: <SlidersHorizontal className="size-4" />,
			badge: "config",
			badgeVariant: "secondary",
			status: "idle",
		} satisfies BaseNodeData,
	},
	{
		id: "generate-1",
		type: "base",
		position: { x: 250, y: 180 },
		data: {
			label: "Generate Image",
			description: "DALL-E 3",
			icon: <Sparkles className="size-4" />,
			badge: "image",
			badgeVariant: "connection-image",
			status: "running",
			targetHandles: [
				{ id: "in-prompt", position: Position.Top },
				{ id: "in-style", position: Position.Top },
			],
		} satisfies BaseNodeData,
	},
	{
		id: "upscale-1",
		type: "base",
		position: { x: 100, y: 380 },
		data: {
			label: "Upscale 4x",
			description: "Real-ESRGAN",
			icon: <ImageIcon className="size-4" />,
			badge: "image",
			badgeVariant: "connection-image",
			status: "idle",
		} satisfies BaseNodeData,
	},
	{
		id: "blend-1",
		type: "base",
		position: { x: 420, y: 380 },
		data: {
			label: "Blend Layers",
			description: "Composite output",
			icon: <Blend className="size-4" />,
			status: "idle",
		} satisfies BaseNodeData,
	},
];

const demoEdges: Edge[] = [
	{
		id: "e-prompt-gen",
		source: "prompt-1",
		target: "generate-1",
		targetHandle: "in-prompt",
		type: "workflow",
		data: {
			label: "text",
			variant: "prompt",
		} satisfies BaseEdgeData,
	},
	{
		id: "e-style-gen",
		source: "style-1",
		target: "generate-1",
		targetHandle: "in-style",
		type: "workflow",
		data: {
			label: "config",
			variant: "default",
		} satisfies BaseEdgeData,
	},
	{
		id: "e-gen-upscale",
		source: "generate-1",
		target: "upscale-1",
		type: "workflow",
		data: {
			variant: "image",
		} satisfies BaseEdgeData,
	},
	{
		id: "e-gen-blend",
		source: "generate-1",
		target: "blend-1",
		type: "workflow",
		data: {
			variant: "image",
		} satisfies BaseEdgeData,
	},
];

const CanvasDemoScreen = () => {
	const canvas = useWorkflowCanvas({
		initialNodes: demoNodes,
		initialEdges: demoEdges,
	});

	const edgesWithDelete = canvas.edges.map((edge) => ({
		...edge,
		data: {
			...edge.data,
			onDelete: canvas.handleDeleteEdge,
		},
	}));

	return (
		<div className="flex h-screen w-full flex-col bg-background">
			<header className="flex items-center justify-between border-b border-border px-5 py-3">
				<div className="flex items-center gap-3">
					<h1 className="text-sm font-medium text-foreground">
						Canvas Demo
					</h1>
					<span className="text-xs text-muted-foreground">
						Drag nodes, connect handles, click edges to delete
					</span>
				</div>
			</header>

			<div className="flex-1">
				<WorkflowCanvas
					nodes={[]}
					edges={[]}
					onNodesChange={canvas.onNodesChange}
					onEdgesChange={canvas.onEdgesChange}
					onConnect={canvas.onConnect}
				/>
			</div>
		</div>
	);
};

export default CanvasDemoScreen;
