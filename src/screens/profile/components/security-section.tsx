"use client";

import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Skeleton,
	Switch,
} from "@/components/ui";
import { KeyRound, ShieldCheck } from "lucide-react";
import { SectionCard, FieldLabel } from "./section-card";
import { useSecuritySection } from "../hook";

export const SecuritySection = () => {
	const {
		isLoaded,
		user,
		isPasswordDialogOpen,
		setIsPasswordDialogOpen,
		isDeleteDialogOpen,
		setIsDeleteDialogOpen,
		passwordForm,
		setPasswordField,
		isUpdatingPassword,
		isDeleting,
		handleUpdatePassword,
		handleDeleteAccount,
	} = useSecuritySection();

	if (!isLoaded || !user) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton className="h-36" />
				<Skeleton className="h-36" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Password */}
			<SectionCard
				title="Password"
				description={
					user.passwordEnabled
						? "Used together with 2FA at sign-in."
						: "Set a password to sign in without a provider."
				}
			>
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="flex size-9 items-center justify-center rounded-[var(--radius)] border border-border bg-secondary text-muted-foreground">
							<KeyRound className="size-4" strokeWidth={2} />
						</span>
						<div>
							<p className="text-sm font-medium text-foreground">
								Account password
							</p>
							<p className="text-sm text-muted-foreground">
								{user.passwordEnabled
									? "Your account password is set."
									: "No password set yet."}
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						onClick={() => setIsPasswordDialogOpen(true)}
					>
						{user.passwordEnabled
							? "Change password"
							: "Set password"}
					</Button>
				</div>
			</SectionCard>

			{/* Two-factor authentication — coming soon */}
			<SectionCard
				title="Two-factor authentication"
				description="Require a one-time code in addition to your password."
			>
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="flex size-9 items-center justify-center rounded-[var(--radius)] border border-border bg-secondary text-muted-foreground">
							<ShieldCheck className="size-4" strokeWidth={2} />
						</span>
						<div>
							<div className="flex items-center gap-2">
								<p className="text-sm font-medium text-foreground">
									Authenticator app
								</p>
								<Badge variant="muted">Coming soon</Badge>
							</div>
							<p className="text-sm text-muted-foreground">
								Protect your account with time-based one-time
								codes.
							</p>
						</div>
					</div>
					<Switch disabled aria-label="Enable two-factor authentication" />
				</div>
			</SectionCard>

			{/* Delete account */}
			<SectionCard
				title="Delete account"
				description="Permanently remove your account and personal data."
			>
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="text-sm font-medium text-foreground">
							Delete your aakriti account
						</p>
						<p className="text-sm text-muted-foreground">
							You&apos;ll be removed from all workspaces. This
							cannot be undone.
						</p>
					</div>
					<Button
						variant="destructive"
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						Delete account
					</Button>
				</div>
			</SectionCard>

			{/* Change password dialog */}
			<Dialog
				open={isPasswordDialogOpen}
				onOpenChange={setIsPasswordDialogOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{user.passwordEnabled
								? "Change password"
								: "Set password"}
						</DialogTitle>
						<DialogDescription>
							You&apos;ll be signed out of all other sessions
							after changing your password.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						{user.passwordEnabled && (
							<div className="flex flex-col gap-2">
								<FieldLabel htmlFor="current-password">
									Current password
								</FieldLabel>
								<Input
									id="current-password"
									type="password"
									autoComplete="current-password"
									value={passwordForm.currentPassword}
									onChange={(e) =>
										setPasswordField(
											"currentPassword",
											e.target.value,
										)
									}
								/>
							</div>
						)}
						<div className="flex flex-col gap-2">
							<FieldLabel htmlFor="new-password">
								New password
							</FieldLabel>
							<Input
								id="new-password"
								type="password"
								autoComplete="new-password"
								value={passwordForm.newPassword}
								onChange={(e) =>
									setPasswordField(
										"newPassword",
										e.target.value,
									)
								}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<FieldLabel htmlFor="confirm-password">
								Confirm new password
							</FieldLabel>
							<Input
								id="confirm-password"
								type="password"
								autoComplete="new-password"
								value={passwordForm.confirmPassword}
								onChange={(e) =>
									setPasswordField(
										"confirmPassword",
										e.target.value,
									)
								}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsPasswordDialogOpen(false)}
							disabled={isUpdatingPassword}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdatePassword}
							disabled={
								isUpdatingPassword ||
								!passwordForm.newPassword ||
								!passwordForm.confirmPassword
							}
						>
							{isUpdatingPassword ? "Saving…" : "Save password"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete account dialog */}
			<Dialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete account</DialogTitle>
						<DialogDescription>
							This permanently deletes your aakriti account and all
							personal data. This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteAccount}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting…" : "Delete account"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
