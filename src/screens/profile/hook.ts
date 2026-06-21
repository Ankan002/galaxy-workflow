"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useReverification, useSession, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useAPIErrorHandler } from "@/hooks/use-error-handler";
import {
	PROFILE_METADATA_KEYS,
	PROFILE_OAUTH_PROVIDERS,
	SIGN_IN_URL,
} from "@/config/client-constants";

type UserResource = NonNullable<ReturnType<typeof useUser>["user"]>;
type SessionWithActivities = Awaited<
	ReturnType<UserResource["getSessions"]>
>[number];
type ExternalAccountResource = UserResource["externalAccounts"][number];

const metaString = (user: UserResource | null | undefined, key: string) =>
	(user?.unsafeMetadata?.[key] as string | undefined) ?? "";

/* ── Profile section ── */
export const useProfileSection = () => {
	const { isLoaded, user } = useUser();
	const { APIErrorHandler } = useAPIErrorHandler();

	const initial = useMemo(
		() => ({
			fullName: user?.fullName ?? "",
			jobTitle: metaString(user, PROFILE_METADATA_KEYS.JOB_TITLE),
			company: metaString(user, PROFILE_METADATA_KEYS.COMPANY),
			phone: metaString(user, PROFILE_METADATA_KEYS.PHONE),
		}),
		[user],
	);

	const [form, setForm] = useState(initial);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
	const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => setForm(initial), [initial]);

	const isDirty = useMemo(
		() => JSON.stringify(form) !== JSON.stringify(initial),
		[form, initial],
	);

	const setField = (key: keyof typeof form, value: string) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const handleSave = async () => {
		if (!user || !isDirty || isSaving) return;
		setIsSaving(true);
		try {
			const trimmed = form.fullName.trim();
			const [firstName, ...rest] = trimmed.length
				? trimmed.split(/\s+/)
				: [""];
			await user.update({
				firstName: firstName ?? "",
				lastName: rest.join(" "),
				unsafeMetadata: {
					...user.unsafeMetadata,
					[PROFILE_METADATA_KEYS.JOB_TITLE]: form.jobTitle,
					[PROFILE_METADATA_KEYS.COMPANY]: form.company,
					[PROFILE_METADATA_KEYS.PHONE]: form.phone,
				},
			});
			toast.success("Profile updated");
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => setForm(initial);

	const handlePickPhoto = () => fileInputRef.current?.click();

	const handlePhotoChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file || !user) return;
		setIsUploadingPhoto(true);
		try {
			await user.setProfileImage({ file });
			toast.success("Photo updated");
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setIsUploadingPhoto(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	return {
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
	};
};

/* ── Email change (create + verify a new primary email, Clerk-only) ── */
export const useEmailChange = (onSuccess?: () => void) => {
	const { user } = useUser();
	const { APIErrorHandler } = useAPIErrorHandler();
	const [step, setStep] = useState<"email" | "code">("email");
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [isPending, setIsPending] = useState(false);
	const pendingEmailRef = useRef<
		UserResource["emailAddresses"][number] | null
	>(null);

	const createEmail = useReverification((address: string) =>
		user!.createEmailAddress({ email: address }),
	);

	const reset = () => {
		setStep("email");
		setEmail("");
		setCode("");
		pendingEmailRef.current = null;
	};

	const submitEmail = async () => {
		if (!user || isPending || !email.trim()) return;
		setIsPending(true);
		try {
			const created = await createEmail(email.trim());
			await created.prepareVerification({ strategy: "email_code" });
			pendingEmailRef.current = created;
			setStep("code");
			toast.success("Verification code sent");
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setIsPending(false);
		}
	};

	const submitCode = async () => {
		const pending = pendingEmailRef.current;
		if (!user || !pending || isPending || !code.trim()) return;
		setIsPending(true);
		try {
			const verified = await pending.attemptVerification({
				code: code.trim(),
			});
			await user.update({ primaryEmailAddressId: verified.id });
			toast.success("Email updated");
			reset();
			onSuccess?.();
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setIsPending(false);
		}
	};

	return {
		step,
		email,
		setEmail,
		code,
		setCode,
		isPending,
		submitEmail,
		submitCode,
		reset,
	};
};

/* ── Security section ── */
export const useSecuritySection = () => {
	const { isLoaded, user } = useUser();
	const router = useRouter();
	const { APIErrorHandler } = useAPIErrorHandler();

	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const updatePassword = useReverification(
		(params: Parameters<UserResource["updatePassword"]>[0]) =>
			user!.updatePassword(params),
	);
	const deleteAccount = useReverification(() => user!.delete());

	const setPasswordField = (key: keyof typeof passwordForm, value: string) =>
		setPasswordForm((prev) => ({ ...prev, [key]: value }));

	const handleUpdatePassword = async () => {
		if (!user || isUpdatingPassword) return;
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}
		setIsUpdatingPassword(true);
		try {
			await updatePassword({
				currentPassword: user.passwordEnabled
					? passwordForm.currentPassword
					: undefined,
				newPassword: passwordForm.newPassword,
				signOutOfOtherSessions: true,
			});
			toast.success("Password updated");
			setIsPasswordDialogOpen(false);
			setPasswordForm({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setIsUpdatingPassword(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (!user || isDeleting) return;
		setIsDeleting(true);
		try {
			await deleteAccount();
			toast.success("Account deleted");
			router.push(SIGN_IN_URL);
		} catch (error) {
			APIErrorHandler()(error);
			setIsDeleting(false);
		}
	};

	return {
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
	};
};

/* ── Connected accounts (OAuth sign-in providers) ── */
export const useConnectedAccounts = () => {
	const { isLoaded, user } = useUser();
	const { APIErrorHandler } = useAPIErrorHandler();
	const [pendingProvider, setPendingProvider] = useState<string | null>(null);

	const disconnect = useReverification((account: ExternalAccountResource) =>
		account.destroy(),
	);

	const providers = useMemo(
		() =>
			PROFILE_OAUTH_PROVIDERS.map((config) => {
				const account = user?.externalAccounts.find(
					(ea) =>
						ea.provider.replace(/^oauth_/, "") === config.provider,
				);
				return {
					config,
					account: account ?? null,
					isLinked:
						!!account &&
						account.verification?.status === "verified",
				};
			}),
		[user],
	);

	const handleConnect = async (
		config: (typeof PROFILE_OAUTH_PROVIDERS)[number],
	) => {
		if (!user || pendingProvider) return;
		setPendingProvider(config.provider);
		try {
			const account = await user.createExternalAccount({
				strategy: config.strategy,
				redirectUrl: window.location.href,
			});
			const redirectUrl =
				account.verification?.externalVerificationRedirectURL;
			if (redirectUrl) {
				window.location.href = redirectUrl.toString();
				return;
			}
			setPendingProvider(null);
		} catch (error) {
			APIErrorHandler()(error);
			setPendingProvider(null);
		}
	};

	const handleDisconnect = async (account: ExternalAccountResource) => {
		if (pendingProvider) return;
		setPendingProvider(account.provider);
		try {
			await disconnect(account);
			toast.success("Account disconnected");
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setPendingProvider(null);
		}
	};

	return {
		isLoaded,
		providers,
		pendingProvider,
		handleConnect,
		handleDisconnect,
	};
};

/* ── Sessions (active devices) ── */
export const useSessions = () => {
	const { isLoaded, user } = useUser();
	const { session: currentSession } = useSession();
	const { APIErrorHandler } = useAPIErrorHandler();
	const [sessions, setSessions] = useState<SessionWithActivities[]>([]);
	const [isLoadingSessions, setIsLoadingSessions] = useState(true);
	const [pendingSessionId, setPendingSessionId] = useState<string | null>(
		null,
	);

	const revoke = useReverification((session: SessionWithActivities) =>
		session.revoke(),
	);

	const refresh = useCallback(async () => {
		if (!user) return;
		setIsLoadingSessions(true);
		try {
			const next = await user.getSessions();
			setSessions(next);
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setIsLoadingSessions(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	useEffect(() => {
		if (user) refresh();
	}, [user, refresh]);

	const handleRevoke = async (session: SessionWithActivities) => {
		if (pendingSessionId) return;
		setPendingSessionId(session.id);
		try {
			await revoke(session);
			toast.success("Session revoked");
			await refresh();
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setPendingSessionId(null);
		}
	};

	const handleSignOutOthers = async () => {
		if (pendingSessionId) return;
		const others = sessions.filter(
			(session) =>
				session.id !== currentSession?.id &&
				session.status === "active",
		);
		if (!others.length) return;
		setPendingSessionId("all");
		try {
			await Promise.all(others.map((session) => revoke(session)));
			toast.success("Signed out of all other sessions");
			await refresh();
		} catch (error) {
			APIErrorHandler()(error);
		} finally {
			setPendingSessionId(null);
		}
	};

	return {
		isLoaded: isLoaded && !isLoadingSessions,
		sessions,
		currentSessionId: currentSession?.id ?? null,
		pendingSessionId,
		handleRevoke,
		handleSignOutOthers,
	};
};

export type { SessionWithActivities, ExternalAccountResource };
