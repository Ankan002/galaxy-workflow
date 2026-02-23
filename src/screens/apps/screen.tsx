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
			<div className="flex-1 flex flex-col items-center justify-center font-sans">
				<SquarePlay size={40} strokeWidth={0.75} />
				<p className="mt-4 text-lg">No design apps</p>
				<Badge
					className="mt-6 border border-foreground/80 p-2 rounded-sm cursor-pointer"
					variant="outline"
				>
					Learn more about design apps
				</Badge>
			</div>
		</DashboardProvider>
	);
};

export default AppsScreen;
