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
