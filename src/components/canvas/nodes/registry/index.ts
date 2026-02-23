"use client";

import type { NodeTypes } from "@xyflow/react";
import { NodeType } from "./types";
import type { NodeDefinition } from "./types";
import {
	TextNode,
	TEXT_DEFINITION,
	ImageUploadNode,
	IMAGE_UPLOAD_DEFINITION,
	VideoUploadNode,
	VIDEO_UPLOAD_DEFINITION,
	RunLlmNode,
	RUN_LLM_DEFINITION,
	CropImageNode,
	CROP_IMAGE_DEFINITION,
	ExtractVideoNode,
	EXTRACT_VIDEO_DEFINITION,
	ExtractVideoFrameNode,
	EXTRACT_VIDEO_FRAME_DEFINITION,
} from "../library";

type NodeDefinitionAny = NodeDefinition<Record<string, unknown>>;

/** Map of NodeType to full NodeDefinition (metadata + Component). */
export const NODE_REGISTRY: Record<NodeType, NodeDefinitionAny> = {
	[NodeType.TEXT]: { ...TEXT_DEFINITION, Component: TextNode } as unknown as NodeDefinitionAny,
	[NodeType.IMAGE_UPLOAD]: { ...IMAGE_UPLOAD_DEFINITION, Component: ImageUploadNode } as unknown as NodeDefinitionAny,
	[NodeType.VIDEO_UPLOAD]: { ...VIDEO_UPLOAD_DEFINITION, Component: VideoUploadNode } as unknown as NodeDefinitionAny,
	[NodeType.RUN_LLM]: { ...RUN_LLM_DEFINITION, Component: RunLlmNode } as unknown as NodeDefinitionAny,
	[NodeType.CROP_IMAGE]: { ...CROP_IMAGE_DEFINITION, Component: CropImageNode } as unknown as NodeDefinitionAny,
	[NodeType.EXTRACT_VIDEO]: { ...EXTRACT_VIDEO_DEFINITION, Component: ExtractVideoNode } as unknown as NodeDefinitionAny,
	[NodeType.EXTRACT_VIDEO_FRAME]: { ...EXTRACT_VIDEO_FRAME_DEFINITION, Component: ExtractVideoFrameNode } as unknown as NodeDefinitionAny,
};

/** React Flow nodeTypes: node type string -> component. Use with <ReactFlow nodeTypes={nodeTypes} /> */
export const nodeTypes: NodeTypes = {
	[NodeType.TEXT]: TextNode,
	[NodeType.IMAGE_UPLOAD]: ImageUploadNode,
	[NodeType.VIDEO_UPLOAD]: VideoUploadNode,
	[NodeType.RUN_LLM]: RunLlmNode,
	[NodeType.CROP_IMAGE]: CropImageNode,
	[NodeType.EXTRACT_VIDEO]: ExtractVideoNode,
	[NodeType.EXTRACT_VIDEO_FRAME]: ExtractVideoFrameNode,
};

export {
	NodeType,
	type NodeDefinition,
	type NodeStatus,
	type InputHandleDef,
	type OutputHandleDef,
	type WorkflowNodeDataBase,
	type HandleDataType,
	type NodeProvider,
	type BaseNodeProps,
} from "./types";
