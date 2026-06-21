"use client";

import { DashboardProvider } from "@/components/providers";
import { ProfileNav } from "./components/profile-nav";

interface Props {
	children: React.ReactNode;
}

/**
 * Shared shell for the profile section. Renders inside the dashboard app shell
 * with a two-column layout: the inner side-nav (each item is its own route) on
 * the left and the active section on the right.
 */
export const ProfileShell: React.FC<Props> = ({ children }) => {
	return (
		<DashboardProvider heading="Your profile">
			<p className="-mt-3 mb-8 max-w-prose text-sm text-muted-foreground">
				Manage your personal details, sign-in security, and connected
				accounts.
			</p>
			<div className="grid grid-cols-[13rem_minmax(0,1fr)] items-start gap-8 pb-16">
				<ProfileNav />
				<div className="min-w-0 max-w-3xl">{children}</div>
			</div>
		</DashboardProvider>
	);
};
