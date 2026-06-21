import {
	AppNavItem,
	ProfileIntegration,
	ProfileMenuItem,
	ProfileNavItem,
	ProfileOAuthProvider,
} from "@/types/common";
import {
	GalleryVerticalEnd,
	Link2,
	LogOut,
	MessagesSquare,
	Monitor,
	Settings,
	Shield,
	SquarePlay,
	SunMoon,
	User,
	Users,
	Webhook,
} from "lucide-react";
import { FaGithub, FaGoogle, FaMicrosoft, FaSlack } from "react-icons/fa6";
import { SiPagerduty } from "react-icons/si";

export const SIGN_IN_URL = "/auth/sign-in";
export const SIGN_UP_URL = "/auth/sign-up";
export const DASHBOARD_URL = "/";
export const PROFILE_URL = "/profile";

/** Each profile section is its own route; the inner side-nav is the shell. */
export const PROFILE_ROUTES = {
	PROFILE: "/profile",
	SECURITY: "/profile/security",
	CONNECTED_ACCOUNTS: "/profile/connected-accounts",
	SESSIONS: "/profile/sessions",
} as const;

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

/** Items in the sidebar profile dropdown. `theme` is rendered dynamically. */
export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
	{
		id: "profile",
		label: "Profile",
		Icon: User,
	},
	{
		id: "settings",
		label: "Settings",
		Icon: Settings,
	},
	{
		id: "theme",
		label: "Theme",
		Icon: SunMoon,
	},
	{
		id: "sign-out",
		label: "Sign out",
		Icon: LogOut,
		isDestructive: true,
	},
];

/** Inner side-nav of the profile page. Each entry is a dedicated route. */
export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
	{ label: "Profile", href: PROFILE_ROUTES.PROFILE, Icon: User },
	{ label: "Security", href: PROFILE_ROUTES.SECURITY, Icon: Shield },
	{
		label: "Connected accounts",
		href: PROFILE_ROUTES.CONNECTED_ACCOUNTS,
		Icon: Link2,
	},
	{ label: "Sessions", href: PROFILE_ROUTES.SESSIONS, Icon: Monitor },
];

/**
 * Keys under Clerk `user.unsafeMetadata` for fields that are not part of the
 * standard Clerk profile (job title, company, phone). Client-writable.
 */
export const PROFILE_METADATA_KEYS = {
	JOB_TITLE: "jobTitle",
	COMPANY: "company",
	PHONE: "phone",
} as const;

/** OAuth sign-in providers enabled in our Clerk instance. */
export const PROFILE_OAUTH_PROVIDERS: ProfileOAuthProvider[] = [
	{
		provider: "google",
		strategy: "oauth_google",
		label: "Google",
		description: "Sign in with your Google account",
		Icon: FaGoogle,
	},
	{
		provider: "microsoft",
		strategy: "oauth_microsoft",
		label: "Microsoft",
		description: "Sign in with Microsoft / Entra ID",
		Icon: FaMicrosoft,
	},
	{
		provider: "github",
		strategy: "oauth_github",
		label: "GitHub",
		description: "Sign in with your GitHub account",
		Icon: FaGithub,
	},
];

/**
 * Alert & notification integrations. Not backed by Clerk — rendered as disabled
 * "coming soon" placeholders until a dedicated integrations backend exists.
 */
export const PROFILE_INTEGRATIONS: ProfileIntegration[] = [
	{
		id: "slack",
		label: "Slack",
		description: "Post workflow alerts to a channel",
		Icon: FaSlack,
	},
	{
		id: "microsoft-teams",
		label: "Microsoft Teams",
		description: "Post alerts to a Teams channel",
		Icon: MessagesSquare,
	},
	{
		id: "pagerduty",
		label: "PagerDuty",
		description: "Trigger incidents on workflow failure",
		Icon: SiPagerduty,
	},
	{
		id: "webhooks",
		label: "Webhooks",
		description: "Send events to any HTTPS endpoint",
		Icon: Webhook,
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
	WORKFLOW_TEMPLATE: {
		LIST: {
			path: "/api/workflow-template",
			method: "GET" as const,
			key: "get-workflow-templates",
		},
		GET_ONE: {
			path: "/api/workflow-template/:templateId",
			dynamicPath: (templateId: string) =>
				`/api/workflow-template/${templateId}`,
			method: "GET" as const,
			key: "get-workflow-template",
		},
		CREATE: {
			path: "/api/workflow-template",
			method: "POST" as const,
			key: "create-workflow-template",
		},
		UPDATE: {
			path: "/api/workflow-template/:templateId",
			dynamicPath: (templateId: string) =>
				`/api/workflow-template/${templateId}`,
			method: "PATCH" as const,
			key: "update-workflow-template",
		},
		DELETE: {
			path: "/api/workflow-template/:templateId",
			dynamicPath: (templateId: string) =>
				`/api/workflow-template/${templateId}`,
			method: "DELETE" as const,
			key: "delete-workflow-template",
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
		STOP: {
			path: `${workflowFileBase}/:workflowId/executions/stop`,
			dynamicPath: (workflowId: string) =>
				`${workflowFileBase}/${workflowId}/executions/stop`,
			method: "POST" as const,
			key: "stop-workflow-execution",
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
