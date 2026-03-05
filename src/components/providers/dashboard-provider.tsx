"use client";

import { AppSidebar } from "../common";
import { SidebarInset, Skeleton, ThemeToggle } from "../ui";

interface Props {
	children: React.ReactNode;
	isHeadingLoading?: boolean;
	heading?: string;
	ActionButton?: React.ReactNode;
}

export const DashboardProvider: React.FC<Props> = ({
	children,
	isHeadingLoading,
	heading,
	ActionButton,
}) => {
	return (
		<>
			<AppSidebar />
			<SidebarInset>
				<div className="w-full min-h-screen flex flex-col font-primary">
					<div className="w-full flex justify-between items-center my-8 px-8 min-h-10">
						<div className="flex items-center gap-3">
							<ThemeToggle />
							{isHeadingLoading ? (
								<Skeleton className="h-5 w-24" />
							) : (
								<p className="text-foreground text-sm ml-1">
									{heading}
								</p>
							)}
						</div>

						{ActionButton && ActionButton}
					</div>
					<div className="w-full flex flex-col gap-2 px-8 flex-1">
						{children}
					</div>
				</div>
			</SidebarInset>
		</>
	);
};
