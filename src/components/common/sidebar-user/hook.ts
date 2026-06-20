import { useIsMobile } from "@/hooks/use-mobile";
import type { ProfileMenuActionId } from "@/types/common";
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";

export const useSidebarUser = () => {
	const { isLoaded, user } = useUser();
	const { signOut } = useAuth();
	const isMobile = useIsMobile();
	const { resolvedTheme, setTheme } = useTheme();

	const isDark = resolvedTheme === "dark";

	const toggleTheme = () => setTheme(isDark ? "light" : "dark");

	const handleMenuAction = (id: ProfileMenuActionId) => {
		switch (id) {
			case "theme":
				toggleTheme();
				break;
			case "sign-out":
				signOut();
				break;
			// Profile / Settings are placeholders until their pages exist.
			case "profile":
			case "settings":
			default:
				break;
		}
	};

	return {
		isLoaded,
		user,
		isMobile,
		isDark,
		toggleTheme,
		handleMenuAction,
		signOut,
	};
};
