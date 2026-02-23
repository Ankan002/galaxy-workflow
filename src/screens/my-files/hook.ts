import { useUser } from "@clerk/nextjs";

export const useMyFiles = () => {
	const { user, isLoaded } = useUser();

	return {
		user,
		isLoaded,
	};
};
