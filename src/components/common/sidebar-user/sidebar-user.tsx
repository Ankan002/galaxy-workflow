"use client";

import {
	DropdownMenu,
	DropdownMenuTrigger,
	SidebarMenu,
	SidebarMenuItem,
	Skeleton,
} from "@/components/ui";

const SidebarUser = () => {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<div className="w-full h-10 rounded-lg flex items-center">
							<Skeleton className="h-10 w-10 rounded-full" />
							<Skeleton className="flex-1 h-10 w-full flex flex-col gap-1 ml-2" />
						</div>
					</DropdownMenuTrigger>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

export default SidebarUser;
