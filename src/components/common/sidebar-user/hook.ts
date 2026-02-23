import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "@clerk/nextjs";

export const useSidebarUser = () => {
	const { isLoaded, user } = useUser();
	const { signOut } = useAuth();
	const isMobile = useIsMobile();

	return {
		isLoaded,
		user,
		isMobile,
		signOut,
	};
};
