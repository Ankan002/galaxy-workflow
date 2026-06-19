"use client";

import { ClerkProvider } from "@clerk/nextjs";

interface Props {
	children: React.ReactNode;
}

/**
 * Clerk styled in the aakriti neobrutalist language. Colors are wired to our
 * CSS tokens (var(--…)) so the widget flips automatically with the .dark theme,
 * and element classes add the 2px ink borders, hard offset shadows, and tactile
 * press that the rest of the app uses.
 */
export const AuthProvider: React.FC<Props> = ({ children }) => {
	return (
		<ClerkProvider
			localization={{
				signIn: {
					start: {
						title: "Sign in to aakriti",
						subtitle: "Welcome back! Please sign in to continue.",
					},
				},
				signUp: {
					start: {
						title: "Create your aakriti account",
						subtitle: "Welcome! Please fill in the details to get started.",
					},
				},
			}}
			appearance={{
				captcha: { theme: "auto" },
				variables: {
					colorPrimary: "var(--primary)",
					colorBackground: "var(--card)",
					colorText: "var(--foreground)",
					colorTextSecondary: "var(--muted-foreground)",
					colorInputBackground: "var(--card)",
					colorInputText: "var(--foreground)",
					colorDanger: "var(--destructive)",
					colorSuccess: "var(--status-completed)",
					colorNeutral: "var(--foreground)",
					borderRadius: "var(--radius)",
					fontFamily: "var(--font-space-grotesk)",
				},
				elements: {
					rootBox: "w-full",
					card: "border-2 border-border bg-card shadow-md rounded-lg",
					headerTitle: "font-display tracking-tight text-foreground",
					headerSubtitle: "text-muted-foreground",
					socialButtons: "gap-2",
					socialButtonsBlockButton:
						"flex h-10 items-center justify-center gap-2.5 border-2 border-border bg-card text-foreground shadow-xs rounded-[var(--radius)] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:shadow-none hover:bg-accent",
					socialButtonsProviderIcon: "size-5 shrink-0",
					socialButtonsBlockButtonText:
						"font-sans font-semibold text-sm truncate",
					dividerLine: "bg-border h-0.5",
					dividerText:
						"font-mono text-xs uppercase tracking-widest text-muted-foreground",
					formFieldLabel: "font-semibold text-foreground",
					formFieldInput:
						"border-2 border-input bg-card text-foreground shadow-xs rounded-[var(--radius)] focus:border-ring focus:shadow-sm",
					formButtonPrimary:
						"border-2 border-border bg-primary text-primary-foreground font-display shadow-sm rounded-[var(--radius)] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:shadow-xs hover:bg-primary-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none normal-case",
					footerActionLink: "text-primary font-semibold hover:text-primary-hover",
					identityPreview: "border-2 border-border bg-card rounded-[var(--radius)]",
					otpCodeFieldInput: "border-2 border-input rounded-[var(--radius)]",
					badge: "border-2 border-border bg-secondary text-secondary-foreground rounded-sm",
				},
			}}
		>
			{children}
		</ClerkProvider>
	);
};
