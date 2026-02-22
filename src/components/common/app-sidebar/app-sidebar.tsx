"use client";

import { Logo } from "@/components/brand";
import {
	Button,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui";
import { GalleryVerticalEnd, Plus } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";

const AppSidebar = () => {
	return (
		<Sidebar
			side="left"
			collapsible="none"
			className="pl-2 pr-2 py-1 font-sans"
		>
			<SidebarHeader>
				<Logo />
			</SidebarHeader>
			<SidebarContent>
				<Button className="mt-2 h-8 rounded-sm">
					<Plus />
					<span>Create New File</span>
				</Button>
				<SidebarMenu className="mt-3">
					<SidebarMenuItem>
						<SidebarMenuButton
							className="h-10 px-3 text-base rounded-sm"
							isActive
						>
							<GalleryVerticalEnd />
							<span>My Files</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarContent>
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
