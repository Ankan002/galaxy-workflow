"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
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
import { useSidebarUser } from "./hook";
import { ChevronDown, CreditCard, LogOut, Settings, User } from "lucide-react";

const SidebarUser = () => {
	const { isLoaded, user, signOut } = useSidebarUser();

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
									<span className="truncate font-light">
										{user.fullName}
									</span>
								</div>
								<ChevronDown className="ms-auto size-4" />
							</SidebarMenuButton>
						)}
					</DropdownMenuTrigger>
					{user && (
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg px-2"
							side="bottom"
							align="start"
							sideOffset={4}
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
										<span className="truncate">
											{user.fullName}
										</span>
									</div>
								</div>
							</DropdownMenuLabel>

							<DropdownMenuLabel className="font-mono text-xs font-normal mt-2">
								Credits
							</DropdownMenuLabel>
							<DropdownMenuLabel className="font-mono text-xs font-normal flex items-center justify-between h-5">
								<p className="flex w-fit items-center gap-1.5">
									<CreditCard className="size-4" />
									<span>100</span>
								</p>
								<Button
									variant="ghost"
									size="sm"
									className="text-xs underline w-30 hover:bg-transparent text-end justify-end hover:no-underline"
								>
									Upgrade for more
								</Button>
							</DropdownMenuLabel>

							<DropdownMenuLabel className="font-mono text-xs font-normal mt-4">
								Plan
							</DropdownMenuLabel>
							<DropdownMenuLabel className="font-mono text-xs font-normal flex items-center justify-between h-5">
								<p className="flex w-fit items-center gap-1.5">
									Free
								</p>
								<Button
									variant="ghost"
									size="sm"
									className="text-xs underline w-30 hover:bg-transparent text-end justify-end hover:no-underline"
								>
									Upgrade
								</Button>
							</DropdownMenuLabel>

							<DropdownMenuSeparator className="mt-2" />

							<DropdownMenuItem className="cursor-pointer mt-1">
								<User className="size-4" />
								<span className="text-xs">Profile</span>
							</DropdownMenuItem>

							<DropdownMenuItem className="cursor-pointer mt-1">
								<Settings className="size-4" />
								<span className="text-xs">Settings</span>
							</DropdownMenuItem>

							<DropdownMenuItem
								className="cursor-pointer mt-1 text-destructive hover:bg-destructive/20 hover:text-destructive"
								onClick={() => signOut()}
							>
								<LogOut className="size-4" />
								<span className="text-xs">Sign out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					)}
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
};

export default SidebarUser;
