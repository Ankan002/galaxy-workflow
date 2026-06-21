"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROFILE_NAV_ITEMS } from "@/config/client-constants";
import { cn } from "@/lib/utils";

export const ProfileNav = () => {
	const pathname = usePathname();

	return (
		<nav className="flex flex-col gap-1">
			{PROFILE_NAV_ITEMS.map(({ label, href, Icon }) => {
				const isActive = pathname === href;
				return (
					<Link
						key={href}
						href={href}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							"flex items-center gap-2.5 rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors [transition-timing-function:var(--ease-snap)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
							isActive
								? "border-border bg-secondary font-medium text-foreground"
								: "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
						)}
					>
						<Icon className="size-4 shrink-0" strokeWidth={2} />
						<span className="truncate">{label}</span>
					</Link>
				);
			})}
		</nav>
	);
};
