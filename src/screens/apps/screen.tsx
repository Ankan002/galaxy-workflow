"use client";

import { DashboardProvider } from "@/components/providers";
import { useAppScreen } from "./hook";
import { SquarePlay } from "lucide-react";

const AppsScreen = () => {
	const { isLoaded, user } = useAppScreen();

	return (
		<DashboardProvider
			isHeadingLoading={!isLoaded}
			heading={user ? `${user.fullName}'s Workspace` : "Workspace"}
		>
			<div className="flex-1 flex flex-col items-center justify-center">
				<SquarePlay
					size={40}
					strokeWidth={1.5}
					className="text-muted-foreground"
				/>
				<p className="mt-4 font-display text-2xl tracking-tight">
					No design apps
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					Design apps are coming soon.
				</p>
			</div>
		</DashboardProvider>
	);
};

export default AppsScreen;
