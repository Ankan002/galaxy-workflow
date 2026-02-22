"use client";

import { Logo } from "@/components/brand";
import {
	Button,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui";
import { FaDiscord } from "react-icons/fa6";

const AppSidebar = () => {
	return (
		<Sidebar side="left" className="pl-2 py-1 font-sans">
			<SidebarHeader>
				<Logo />
			</SidebarHeader>
			<SidebarContent></SidebarContent>
			<SidebarFooter>
				<Button
					variant="ghost"
					className="justify-start h-12 text-base rounded-sm"
				>
					<FaDiscord className="size-6 mr-1" />
					Discord
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
};

export default AppSidebar;
