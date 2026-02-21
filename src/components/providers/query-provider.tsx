"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { clientUtils } from "@/utils/client";

interface Props {
	children: React.ReactNode;
}

export const QueryProvider: React.FC<Props> = ({ children }) => {
	return (
		<QueryClientProvider client={clientUtils.queryClient.client}>
			{children}
		</QueryClientProvider>
	);
};
