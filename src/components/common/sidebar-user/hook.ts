import { useIsMobile } from "@/hooks/use-mobile";
import { PROFILE_URL } from "@/config/client-constants";
import type { ProfileMenuActionId } from "@/types/common";
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export const useSidebarUser = () => {
	const { isLoaded, user } = useUser();
	const { signOut } = useAuth();
	const isMobile = useIsMobile();
	const { resolvedTheme, setTheme } = useTheme();
	const router = useRouter();

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
			case "profile":
				router.push(PROFILE_URL);
				break;
			// Settings is a placeholder until its page exists.
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
