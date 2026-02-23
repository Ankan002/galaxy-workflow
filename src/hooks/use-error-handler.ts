"use client";
import { toast } from "sonner";

type ErrorHandlerFunc = (error: Error) => void;

export const useAPIErrorHandler = () => {
	//TODO: Remove auth token from here for preventing infinite load

	const APIErrorHandler =
		(customHandler?: ErrorHandlerFunc) => (error: unknown) => {
			if (error instanceof Error) {
				if (customHandler) {
					customHandler(error);
					return;
				}

				toast.error(error.message);
				return;
			}

			toast.error("Some Error Occurred!");
		};

	return {
		APIErrorHandler,
	};
};
