import { useUser } from "@clerk/nextjs";

export const useAppScreen = () => {
	const { isLoaded, user } = useUser();

	return {
		isLoaded,
		user,
	};
};
