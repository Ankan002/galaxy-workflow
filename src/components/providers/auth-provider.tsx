"use client";

import { ClerkProvider } from "@clerk/nextjs";

interface Props {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
	return <ClerkProvider>{children}</ClerkProvider>;
};
