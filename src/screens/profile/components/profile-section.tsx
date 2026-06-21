"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	Input,
	Separator,
	Skeleton,
} from "@/components/ui";
import { Camera } from "lucide-react";
import { SectionCard, FieldLabel } from "./section-card";
import { EmailChangeDialog } from "./email-change-dialog";
import { useProfileSection } from "../hook";

export const ProfileSection = () => {
	const {
		isLoaded,
		user,
		form,
		setField,
		isDirty,
		isSaving,
		isUploadingPhoto,
		fileInputRef,
		handleSave,
		handleCancel,
		handlePickPhoto,
		handlePhotoChange,
		isEmailDialogOpen,
		setIsEmailDialogOpen,
	} = useProfileSection();

	if (!isLoaded || !user) {
		return (
			<SectionCard
				title="Personal information"
				description="This appears on activity logs and to teammates."
			>
				<div className="flex flex-col gap-6">
					<Skeleton className="h-14 w-64" />
					<div className="grid grid-cols-2 gap-x-6 gap-y-5">
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
					</div>
				</div>
			</SectionCard>
		);
	}

	const subtitle = [form.jobTitle, form.company].filter(Boolean).join(" · ");
	const primaryEmail = user.primaryEmailAddress?.emailAddress ?? "";

	return (
		<>
			<SectionCard
				title="Personal information"
				description="This appears on activity logs and to teammates."
				footer={
					<>
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={!isDirty || isSaving}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={!isDirty || isSaving}
						>
							{isSaving ? "Saving…" : "Save changes"}
						</Button>
					</>
				}
			>
				{/* Identity row */}
				<div className="flex items-center gap-4">
					<div className="relative">
						<Avatar className="size-16">
							<AvatarImage src={user.imageUrl} />
							<AvatarFallback className="text-lg">
								{user.fullName?.charAt(0) ??
									primaryEmail.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<button
							type="button"
							onClick={handlePickPhoto}
							disabled={isUploadingPhoto}
							aria-label="Change photo"
							className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
						>
							<Camera className="size-3" strokeWidth={2} />
						</button>
					</div>
					<div className="min-w-0">
						<p className="truncate font-sans font-semibold text-foreground">
							{user.fullName || "Unnamed"}
						</p>
						{subtitle && (
							<p className="truncate text-sm text-muted-foreground">
								{subtitle}
							</p>
						)}
						<button
							type="button"
							onClick={handlePickPhoto}
							disabled={isUploadingPhoto}
							className="mt-1 text-sm font-medium text-foreground underline decoration-1 underline-offset-4 transition-colors hover:text-muted-foreground disabled:opacity-50"
						>
							{isUploadingPhoto ? "Uploading…" : "Change photo"}
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handlePhotoChange}
						/>
					</div>
				</div>

				<Separator className="my-6" />

				{/* Editable fields */}
				<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
					<div className="flex flex-col gap-2">
						<FieldLabel htmlFor="full-name">Full name</FieldLabel>
						<Input
							id="full-name"
							value={form.fullName}
							onChange={(e) =>
								setField("fullName", e.target.value)
							}
							placeholder="Your name"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<FieldLabel htmlFor="job-title">Job title</FieldLabel>
						<Input
							id="job-title"
							value={form.jobTitle}
							onChange={(e) =>
								setField("jobTitle", e.target.value)
							}
							placeholder="e.g. IT Lead"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<FieldLabel htmlFor="company">Company</FieldLabel>
						<Input
							id="company"
							value={form.company}
							onChange={(e) => setField("company", e.target.value)}
							placeholder="e.g. Mehra & Sons"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<FieldLabel htmlFor="phone">Phone</FieldLabel>
						<Input
							id="phone"
							type="tel"
							value={form.phone}
							onChange={(e) => setField("phone", e.target.value)}
							placeholder="+91 98200 12345"
						/>
					</div>
					<div className="flex flex-col gap-2 sm:col-span-2">
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<div className="flex items-center gap-2">
							<Input
								id="email"
								value={primaryEmail}
								readOnly
								className="flex-1"
							/>
							<Button
								variant="outline"
								onClick={() => setIsEmailDialogOpen(true)}
							>
								Change
							</Button>
						</div>
					</div>
				</div>
			</SectionCard>

			<EmailChangeDialog
				open={isEmailDialogOpen}
				onOpenChange={setIsEmailDialogOpen}
			/>
		</>
	);
};
