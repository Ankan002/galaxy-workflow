import { AppNavItem } from "@/types/common";
import { GalleryVerticalEnd, SquarePlay, Users } from "lucide-react";

export const SIGN_IN_URL = "/auth/sign-in";
export const SIGN_UP_URL = "/auth/sign-up";
export const DASHBOARD_URL = "/";

export const OAUTH_ERROR_MAP: Record<string, string> = {
	access_denied: "You cancelled the login process.",

	account_exists_with_different_credential:
		"This email is already registered. Please sign in using the original provider.",

	oauth_callback_error: "Authentication failed. Please try again.",

	invalid_request: "Invalid authentication request.",

	server_error: "The provider encountered an error. Try again later.",
};

export const APP_NAV_ITEMS: AppNavItem[] = [
	{
		Icon: GalleryVerticalEnd,
		label: "My Files",
		href: "/",
	},
	{
		Icon: Users,
		label: "Shared with me",
		href: "/shared-with-me",
		isDisabled: true,
	},
	{
		Icon: SquarePlay,
		label: "Apps",
		href: "/apps",
	},
];

const workflowFileBase = "/api/workflow-file";

export const API_ROUTES = {
	WORKFLOW_FILE: {
		CREATE: {
			path: workflowFileBase,
			method: "POST" as const,
			key: "create-workflow-file",
		},
		GET: {
			path: workflowFileBase,
			method: "GET" as const,
			key: "get-workflow-files",
		},
		GET_ONE: {
			path: `${workflowFileBase}/:workflowId`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}`,
			method: "GET" as const,
			key: "get-workflow-file",
		},
		UPDATE: {
			path: `${workflowFileBase}/:workflowId`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}`,
			method: "PATCH" as const,
			key: "update-workflow-file",
		},
		DELETE: {
			path: `${workflowFileBase}/:workflowId`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}`,
			method: "DELETE" as const,
			key: "delete-workflow-file",
		},
		EXPORT: {
			path: `${workflowFileBase}/:workflowId/export`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}/export`,
			method: "GET" as const,
			key: "export-workflow",
		},
		IMPORT: {
			path: `${workflowFileBase}/import`,
			method: "POST" as const,
			key: "import-workflow",
		},
	},
	WORKFLOW_NODES: {
		LIST: {
			path: `${workflowFileBase}/:workflowId/nodes`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}/nodes`,
			method: "GET" as const,
			key: "get-workflow-nodes",
		},
		CREATE: {
			path: `${workflowFileBase}/:workflowId/nodes`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}/nodes`,
			method: "POST" as const,
			key: "create-workflow-node",
		},
	},
	WORKFLOW_NODE: {
		GET: {
			path: `${workflowFileBase}/:workflowId/nodes/:nodeId`,
			dynamicPath: (workflowId: string, nodeId: string) =>
				`${workflowFileBase}/${workflowId}/nodes/${nodeId}`,
			method: "GET" as const,
			key: "get-workflow-node",
		},
		UPDATE: {
			path: `${workflowFileBase}/:workflowId/nodes/:nodeId`,
			dynamicPath: (workflowId: string, nodeId: string) =>
				`${workflowFileBase}/${workflowId}/nodes/${nodeId}`,
			method: "PATCH" as const,
			key: "update-workflow-node",
		},
		DELETE: {
			path: `${workflowFileBase}/:workflowId/nodes/:nodeId`,
			dynamicPath: (workflowId: string, nodeId: string) =>
				`${workflowFileBase}/${workflowId}/nodes/${nodeId}`,
			method: "DELETE" as const,
			key: "delete-workflow-node",
		},
		UPLOAD_PREPARE: {
			path: `${workflowFileBase}/:workflowId/nodes/:nodeId/upload/prepare`,
			dynamicPath: (workflowId: string, nodeId: string) =>
				`${workflowFileBase}/${workflowId}/nodes/${nodeId}/upload/prepare`,
			method: "POST" as const,
			key: "upload-prepare",
		},
		UPLOAD_COMPLETE: {
			path: `${workflowFileBase}/:workflowId/nodes/:nodeId/upload/complete`,
			dynamicPath: (workflowId: string, nodeId: string) =>
				`${workflowFileBase}/${workflowId}/nodes/${nodeId}/upload/complete`,
			method: "POST" as const,
			key: "upload-complete",
		},
		EXECUTE: {
			path: `${workflowFileBase}/:workflowId/nodes/:nodeId/execute`,
			dynamicPath: (workflowId: string, nodeId: string) =>
				`${workflowFileBase}/${workflowId}/nodes/${nodeId}/execute`,
			method: "POST" as const,
			key: "execute-node",
		},
	},
	WORKFLOW_EXECUTE_FLOW: {
		path: `${workflowFileBase}/:workflowId/execute-flow`,
		dynamicPath: (workflowId: string) =>
			`${workflowFileBase}/${workflowId}/execute-flow`,
		method: "POST" as const,
		key: "execute-workflow-flow",
	},
	WORKFLOW_EXECUTIONS: {
		LIST: {
			path: `${workflowFileBase}/:workflowId/executions`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}/executions`,
			method: "GET" as const,
			key: "get-workflow-executions",
		},
		GET_ONE: {
			path: `${workflowFileBase}/:workflowId/executions/:executionId`,
			dynamicPath: (workflowId: string, executionId: string) =>
				`${workflowFileBase}/${workflowId}/executions/${executionId}`,
			method: "GET" as const,
			key: "get-workflow-execution",
		},
	},
	WORKFLOW_EDGES: {
		LIST: {
			path: `${workflowFileBase}/:workflowId/edges`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}/edges`,
			method: "GET" as const,
			key: "get-workflow-edges",
		},
		CREATE: {
			path: `${workflowFileBase}/:workflowId/edges`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}/edges`,
			method: "POST" as const,
			key: "create-workflow-edge",
		},
	},
	WORKFLOW_EDGE: {
		GET: {
			path: `${workflowFileBase}/:workflowId/edges/:edgeId`,
			dynamicPath: (workflowId: string, edgeId: string) =>
				`${workflowFileBase}/${workflowId}/edges/${edgeId}`,
			method: "GET" as const,
			key: "get-workflow-edge",
		},
		DELETE: {
			path: `${workflowFileBase}/:workflowId/edges/:edgeId`,
			dynamicPath: (workflowId: string, edgeId: string) =>
				`${workflowFileBase}/${workflowId}/edges/${edgeId}`,
			method: "DELETE" as const,
			key: "delete-workflow-edge",
		},
	},
};

export const DEBOUNCE_TIME = 500;
