"use client";

import type { ComponentType, ReactNode } from "react";
import type { NodeProps } from "@xyflow/react";

/** Strongly typed node type enum for the workflow builder */
export enum NodeType {
	TEXT = "TEXT",
	IMAGE_UPLOAD = "IMAGE_UPLOAD",
	VIDEO_UPLOAD = "VIDEO_UPLOAD",
	RUN_LLM = "RUN_LLM",
	CROP_IMAGE = "CROP_IMAGE",
	EXTRACT_VIDEO = "EXTRACT_VIDEO",
	EXTRACT_VIDEO_FRAME = "EXTRACT_VIDEO_FRAME",
}

/** Provider that backs the node implementation */
export type NodeProvider = "INTERNAL" | "TRANSLOADIT" | "TRIGGER_DEV";

/** Data type for a handle (used for connection validation / UX) */
export type HandleDataType =
	| "string"
	| "number"
	| "boolean"
	| "json"
	| "image"
	| "video"
	| "file"
	| "any";

export interface InputHandleDef {
	key: string;
	type: HandleDataType;
	required?: boolean;
}

export interface OutputHandleDef {
	key: string;
	type: HandleDataType;
}

/** Base data present on every workflow node */
export interface WorkflowNodeDataBase {
	/** Node type (must match React Flow node.type) */
	type: NodeType;
	/** Override label from definition (optional) */
	label?: string;
	/** Execution status */
	status?: NodeStatus;
	[key: string]: unknown;
}

export type NodeStatus = "idle" | "running" | "completed" | "failed";

/** Node definition: static metadata + component for a node type */
export interface NodeDefinition<TConfig = Record<string, unknown>> {
	type: NodeType;
	label: string;
	description: string;
	provider: NodeProvider;
	inputHandles: InputHandleDef[];
	outputHandles: OutputHandleDef[];
	defaultConfig: TConfig;
	/** React component that renders this node (extends BaseNode) */
	Component: ComponentType<NodeProps>;
}

/** Props passed to BaseNode by specific node components */
export interface BaseNodeProps {
	label: string;
	description?: string;
	status?: NodeStatus;
	inputHandles: InputHandleDef[];
	outputHandles: OutputHandleDef[];
	selected?: boolean;
	children?: ReactNode;
	/** Optional icon (e.g. for legacy "base" nodes) */
	icon?: ReactNode;
	/** Optional badge label (e.g. for legacy "base" nodes) */
	badge?: string;
	/** Optional badge variant (e.g. for legacy "base" nodes) */
	badgeVariant?:
		| "default"
		| "secondary"
		| "destructive"
		| "outline"
		| "connection-prompt"
		| "connection-image"
		| "success"
		| "brand"
		| "warning";
}
