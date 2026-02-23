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

export const API_ROUTES = {
	WORKFLOW_FILE: {
		CREATE: {
			path: "/api/workflow-file",
			method: "POST",
			key: "create-workflow-file",
		},
		GET: {
			path: "/api/workflow-file",
			method: "GET",
			key: "get-workflow-files",
		},
	},
};

export const DEBOUNCE_TIME = 500;
