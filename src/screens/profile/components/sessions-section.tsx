"use client";

import { Badge, Button, Skeleton } from "@/components/ui";
import { LogOut, Monitor, Smartphone } from "lucide-react";
import { SectionCard } from "./section-card";
import { useSessions, type SessionWithActivities } from "../hook";

const formatRelativeTime = (date: Date | null | undefined) => {
	if (!date) return "Unknown";
	const diffMs = Date.now() - date.getTime();
	const minutes = Math.round(diffMs / 60_000);
	if (minutes < 1) return "Active now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days === 1) return "Yesterday";
	if (days < 30) return `${days}d ago`;
	return date.toLocaleDateString();
};

const getDeviceLabel = (session: SessionWithActivities) => {
	const activity = session.latestActivity;
	const parts = [activity?.deviceType, activity?.browserName].filter(Boolean);
	return parts.length ? parts.join(" · ") : "Unknown device";
};

const getLocation = (session: SessionWithActivities) => {
	const activity = session.latestActivity;
	return [activity?.city, activity?.country].filter(Boolean).join(", ");
};

export const SessionsSection = () => {
	const {
		isLoaded,
		sessions,
		currentSessionId,
		pendingSessionId,
		handleRevoke,
		handleSignOutOthers,
	} = useSessions();

	if (!isLoaded) {
		return <Skeleton className="h-64" />;
	}

	const hasOtherSessions = sessions.some(
		(session) =>
			session.id !== currentSessionId && session.status === "active",
	);

	return (
		<SectionCard
			title="Active sessions"
			description="Devices currently signed in to your account."
			footer={
				<Button
					variant="outline"
					size="sm"
					onClick={handleSignOutOthers}
					disabled={!hasOtherSessions || pendingSessionId === "all"}
				>
					<LogOut className="size-3.5" strokeWidth={2} />
					{pendingSessionId === "all"
						? "Signing out…"
						: "Sign out all other sessions"}
				</Button>
			}
		>
			<ul className="flex flex-col">
				{sessions.map((session, index) => {
					const isCurrent = session.id === currentSessionId;
					const isMobile = session.latestActivity?.isMobile;
					const DeviceIcon = isMobile ? Smartphone : Monitor;
					const location = getLocation(session);
					const isPending = pendingSessionId === session.id;
					return (
						<li
							key={session.id}
							className={
								"flex items-center justify-between gap-4 py-4" +
								(index !== 0 ? " border-t border-border" : "")
							}
						>
							<div className="flex min-w-0 items-center gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-border bg-secondary text-muted-foreground">
									<DeviceIcon
										className="size-4"
										strokeWidth={2}
									/>
								</span>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<p className="truncate text-sm font-medium text-foreground">
											{getDeviceLabel(session)}
										</p>
										{isCurrent && (
											<Badge variant="success">
												This device
											</Badge>
										)}
									</div>
									<p className="truncate text-sm text-muted-foreground">
										{[
											location,
											isCurrent
												? "Active now"
												: formatRelativeTime(
														session.lastActiveAt,
													),
										]
											.filter(Boolean)
											.join(" · ")}
									</p>
								</div>
							</div>

							{!isCurrent && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleRevoke(session)}
									disabled={isPending}
								>
									{isPending ? "Revoking…" : "Revoke"}
								</Button>
							)}
						</li>
					);
				})}
			</ul>
		</SectionCard>
	);
};
