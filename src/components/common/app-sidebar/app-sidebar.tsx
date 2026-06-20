"use client";

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
import { LongLogo } from "@/components/brand";
import { APP_NAV_ITEMS } from "@/config/client-constants";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { SidebarUser } from "../sidebar-user";
import { useAppSidebar } from "./hook";

const AppSidebar = () => {
	const { handleCreateWorkflowFile, isCreatingWorkflowFile, pathname } =
		useAppSidebar();

	return (
		<Sidebar
			side="left"
			collapsible="none"
			variant="sidebar"
			className="pl-2 pr-2 py-1 font-sans"
		>
			<SidebarHeader className="mt-1 px-2 py-2">
				<LongLogo />
			</SidebarHeader>
			<SidebarContent>
				<Button
					className="mt-2 h-8 rounded-sm"
					onClick={handleCreateWorkflowFile}
					disabled={isCreatingWorkflowFile}
				>
					{isCreatingWorkflowFile ? (
						<Loader2 className="animate-spin" />
					) : (
						<Plus />
					)}
					<span>Create New File</span>
				</Button>
				<SidebarMenu className="mt-3 gap-2">
					{APP_NAV_ITEMS.map((item) => (
						<SidebarMenuItem key={item.href}>
							<Link href={item.href}>
								<SidebarMenuButton
									className="h-10 px-3 text-base rounded-sm"
									isActive={pathname === item.href}
									disabled={item.isDisabled}
									ripple
								>
									<item.Icon />
									<span>{item.label}</span>
								</SidebarMenuButton>
							</Link>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter>
				<SidebarUser />
			</SidebarFooter>
		</Sidebar>
	);
};

export default AppSidebar;
