"use client";

import { DashboardProvider } from "@/components/providers";
import { useAppScreen } from "./hook";
import { SquarePlay } from "lucide-react";
import { Badge } from "@/components/ui";

const AppsScreen = () => {
	const { isLoaded, user } = useAppScreen();

	return (
		<DashboardProvider
			isHeadingLoading={!isLoaded}
			heading={user ? `${user.fullName}'s Workspace` : "Workspace"}
		>
			<div className="flex-1 flex flex-col items-center justify-center">
				<SquarePlay size={40} strokeWidth={1.5} />
				<p className="mt-4 font-display text-2xl tracking-tight">
					No design apps
				</p>
				<Badge
					size="lg"
					className="mt-6 cursor-pointer transition-colors hover:bg-accent"
					variant="outline"
				>
					Learn more about design apps
				</Badge>
			</div>
		</DashboardProvider>
	);
};

export default AppsScreen;
