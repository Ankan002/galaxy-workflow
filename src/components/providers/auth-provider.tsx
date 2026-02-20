"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";

interface Props {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
	return (
		<ClerkProvider
			appearance={{
				theme: shadcn,
				captcha: {
					theme: "dark",
				},
			}}
		>
			{children}
		</ClerkProvider>
	);
};
