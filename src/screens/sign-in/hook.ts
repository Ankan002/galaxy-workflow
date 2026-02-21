import { clientUtils } from "@/utils/client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export const useSignInScreen = () => {
	const searchParams = useSearchParams();

	useEffect(() => {
		if (
			searchParams.get("error") &&
			searchParams.get("error_description")
		) {
			const error = searchParams.get("error") as string;
			const errorDescription = searchParams.get(
				"error_description",
			) as string;

			const mappedError = clientUtils.errorMapper.resolveOAuthError(
				error,
				errorDescription,
			);

			toast.error(mappedError);
		}
	}, [searchParams]);
};
