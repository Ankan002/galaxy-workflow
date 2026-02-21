import { OAUTH_ERROR_MAP } from "@/config/client-constants";

export class ErrorMapper {
	resolveOAuthError(error: string | null, description?: string | null) {
		if (!error) return null;

		return (
			OAUTH_ERROR_MAP[error] ||
			description ||
			"Something went wrong during sign-in."
		);
	}
}
