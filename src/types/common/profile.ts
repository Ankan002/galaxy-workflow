import { LucideIcon } from "lucide-react";

/** Actions a profile dropdown item can trigger. */
export type ProfileMenuActionId = "profile" | "settings" | "theme" | "sign-out";

export interface ProfileMenuItem {
	id: ProfileMenuActionId;
	/** Default label. The `theme` item is rendered dynamically (light/dark). */
	label: string;
	Icon: LucideIcon;
	isDestructive?: boolean;
}
