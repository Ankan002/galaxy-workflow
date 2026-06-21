import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons/lib";
import type { OAuthStrategy } from "@clerk/types";

/** Actions a profile dropdown item can trigger. */
export type ProfileMenuActionId = "profile" | "settings" | "theme" | "sign-out";

export interface ProfileMenuItem {
	id: ProfileMenuActionId;
	/** Default label. The `theme` item is rendered dynamically (light/dark). */
	label: string;
	Icon: LucideIcon;
	isDestructive?: boolean;
}

/** A section in the profile page's inner side-nav (each is its own route). */
export interface ProfileNavItem {
	label: string;
	href: string;
	Icon: LucideIcon;
}

/**
 * An OAuth sign-in provider surfaced under Connected accounts. `strategy` is the
 * Clerk OAuth strategy passed to `user.createExternalAccount`; `provider` matches
 * the value on `externalAccount.provider` (sans the `oauth_` prefix).
 */
export interface ProfileOAuthProvider {
	provider: string;
	strategy: OAuthStrategy;
	label: string;
	description: string;
	Icon: IconType;
}

/**
 * An alert/notification integration. These are not backed by Clerk, so they are
 * rendered as disabled "coming soon" placeholders for now.
 */
export interface ProfileIntegration {
	id: string;
	label: string;
	description: string;
	Icon: LucideIcon | IconType;
}
