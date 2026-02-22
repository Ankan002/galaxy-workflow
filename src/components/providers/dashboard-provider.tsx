"use client";

import { AppSidebar } from "../common";
import { SidebarInset } from "../ui";

interface Props {
	children: React.ReactNode;
}

export const DashboardProvider: React.FC<Props> = ({ children }) => {
	return (
		<>
			<AppSidebar />
			<SidebarInset>
				<div className="w-full min-h-screen flex flex-col font-primary">
					<div className="w-full flex justify-between items-center my-2 px-2">
						<div className="flex items-center">
							{/* {isHeadingLoading ? (
								<Skeleton className="h-5 w-24 bg-primary" />
							) : (
								<p className="text-primary text-lg ml-1">
									{heading}
								</p>
							)} */}
						</div>

						{/* {ActionButton && ActionButton} */}
					</div>
					<div className="w-full flex flex-col gap-2 px-4 flex-1">
						{children}
					</div>
				</div>
			</SidebarInset>
		</>
	);
};
