import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons/lib";

export interface AppNavItem {
	Icon: LucideIcon | IconType;
	label: string;
	href: string;
	isDisabled?: boolean;
}
