"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	Skeleton,
} from "@/components/ui";
import { PROFILE_MENU_ITEMS } from "@/config/client-constants";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Moon, Sun } from "lucide-react";
import { useSidebarUser } from "./hook";

const SidebarUser = () => {
	const { isLoaded, user, isDark, handleMenuAction } = useSidebarUser();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						{!isLoaded || !user ? (
							<div className="w-full h-10 rounded-lg flex items-center">
								<Skeleton className="h-10 w-10 rounded-full" />
								<Skeleton className="flex-1 h-10 w-full flex flex-col gap-1 ml-2" />
							</div>
						) : (
							<SidebarMenuButton
								size="lg"
								className="border border-border data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent h-14"
								ripple
							>
								<Avatar>
									<AvatarImage src={user.imageUrl} />
									<AvatarFallback>
										{user.fullName?.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-start text-sm leading-tight">
									<span className="truncate font-medium">
										{user.fullName}
									</span>
								</div>
								<ChevronsUpDown className="ms-auto size-4 text-sidebar-foreground/70" />
							</SidebarMenuButton>
						)}
					</DropdownMenuTrigger>
					{user && (
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							side="top"
							align="start"
							sideOffset={8}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
									<Avatar className="h-7 w-7 rounded-lg">
										<AvatarImage src={user.imageUrl} />
										<AvatarFallback>
											{user.fullName?.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-start text-sm leading-tight">
										<span className="truncate font-medium">
											{user.fullName}
										</span>
									</div>
								</div>
							</DropdownMenuLabel>

							<DropdownMenuSeparator />

							{PROFILE_MENU_ITEMS.map((item) => {
								if (item.id === "theme") {
									const ThemeIcon = isDark ? Sun : Moon;
									return (
										<DropdownMenuItem
											key={item.id}
											className="cursor-pointer"
											onSelect={(e) => {
												e.preventDefault();
												handleMenuAction("theme");
											}}
										>
											<ThemeIcon className="size-4" />
											<span className="text-xs">
												{isDark ? "Light mode" : "Dark mode"}
											</span>
										</DropdownMenuItem>
									);
								}

								return (
									<DropdownMenuItem
										key={item.id}
										className={cn(
											"cursor-pointer",
											item.isDestructive &&
												"text-destructive hover:bg-destructive/20 hover:text-destructive focus:text-destructive",
										)}
										onSelect={() => handleMenuAction(item.id)}
									>
										<item.Icon className="size-4" />
										<span className="text-xs">{item.label}</span>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuContent>
					)}
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

export default SidebarUser;
