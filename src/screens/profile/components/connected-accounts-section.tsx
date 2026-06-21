"use client";

import { Badge, Button, Skeleton } from "@/components/ui";
import { Check, Plug } from "lucide-react";
import { PROFILE_INTEGRATIONS } from "@/config/client-constants";
import { SectionCard } from "./section-card";
import { useConnectedAccounts } from "../hook";

export const ConnectedAccountsSection = () => {
	const { isLoaded, providers, pendingProvider, handleConnect, handleDisconnect } =
		useConnectedAccounts();

	if (!isLoaded) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton className="h-48" />
				<Skeleton className="h-56" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* OAuth sign-in providers */}
			<SectionCard
				title="Sign-in providers"
				description="Link a provider to sign in without a password."
			>
				<ul className="flex flex-col">
					{providers.map(({ config, account, isLinked }, index) => {
						const isPending = pendingProvider === config.provider;
						const ProviderIcon = config.Icon;
						return (
							<li
								key={config.provider}
								className={
									"flex items-center justify-between gap-4 py-4" +
									(index !== 0 ? " border-t border-border" : "")
								}
							>
								<div className="flex min-w-0 items-center gap-3">
									<span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-border bg-secondary text-foreground">
										<ProviderIcon className="size-4" />
									</span>
									<div className="min-w-0">
										<p className="text-sm font-medium text-foreground">
											{config.label}
										</p>
										<p className="truncate text-sm text-muted-foreground">
											{isLinked && account?.emailAddress
												? account.emailAddress
												: config.description}
										</p>
									</div>
								</div>

								<div className="flex shrink-0 items-center gap-2">
									{isLinked && account ? (
										<>
											<Badge
												variant="success"
												className="gap-1"
											>
												<Check
													className="size-3"
													strokeWidth={2.5}
												/>
												Linked
											</Badge>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handleDisconnect(account)
												}
												disabled={isPending}
											>
												{isPending
													? "Removing…"
													: "Disconnect"}
											</Button>
										</>
									) : (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleConnect(config)
											}
											disabled={isPending}
										>
											{isPending ? "Connecting…" : "Connect"}
										</Button>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			</SectionCard>

			{/* Alert & notification integrations — coming soon */}
			<SectionCard
				title="Alert & notification integrations"
				description="Send workflow events to the tools your team already uses."
			>
				<ul className="flex flex-col">
					{PROFILE_INTEGRATIONS.map((integration, index) => {
						const IntegrationIcon = integration.Icon;
						return (
							<li
								key={integration.id}
								className={
									"flex items-center justify-between gap-4 py-4" +
									(index !== 0 ? " border-t border-border" : "")
								}
							>
								<div className="flex min-w-0 items-center gap-3">
									<span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-border bg-secondary text-muted-foreground">
										<IntegrationIcon className="size-4" />
									</span>
									<div className="min-w-0">
										<p className="text-sm font-medium text-foreground">
											{integration.label}
										</p>
										<p className="truncate text-sm text-muted-foreground">
											{integration.description}
										</p>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<Badge variant="muted">Coming soon</Badge>
									<Button
										variant="outline"
										size="sm"
										disabled
									>
										<Plug
											className="size-3.5"
											strokeWidth={2}
										/>
										Connect
									</Button>
								</div>
							</li>
						);
					})}
				</ul>
			</SectionCard>
		</div>
	);
};
