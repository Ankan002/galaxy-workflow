"use client";

import { ClerkProvider } from "@clerk/nextjs";

interface Props {
	children: React.ReactNode;
}

/**
 * Clerk styled in the aakriti warm-monochrome language. Colors are wired to our
 * CSS tokens (var(--…)) so the widget flips automatically with the .dark theme,
 * and element classes carry the 1px hairline borders, flat surfaces, and quiet
 * ink CTA that the rest of the app uses — no hard shadows, no tactile press.
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
					card: "border border-border bg-card shadow-md rounded-lg",
					headerTitle: "font-display tracking-tight text-foreground",
					headerSubtitle: "text-muted-foreground",
					socialButtons: "gap-2",
					socialButtonsBlockButton:
						"flex h-10 items-center justify-center gap-2.5 border border-border bg-card text-foreground rounded-[var(--radius)] transition-colors hover:bg-accent",
					socialButtonsProviderIcon: "size-5 shrink-0",
					socialButtonsBlockButtonText:
						"font-sans font-medium text-sm truncate",
					dividerLine: "bg-border h-px",
					dividerText:
						"font-mono text-xs uppercase tracking-widest text-muted-foreground",
					formFieldLabel: "font-medium text-foreground",
					formFieldInput:
						"border border-input bg-card text-foreground rounded-[var(--radius)] transition-colors focus:border-ring",
					formButtonPrimary:
						// `!` wins over Clerk's injected styles, which otherwise keep white
						// text on the light dark-mode CTA (invisible). Forces the token pair.
						"border border-transparent !bg-primary !text-primary-foreground font-sans font-medium rounded-[var(--radius)] transition-colors hover:!bg-primary-hover normal-case",
					footerActionLink: "text-foreground font-medium underline underline-offset-4 hover:text-muted-foreground",
					identityPreview: "border border-border bg-card rounded-[var(--radius)]",
					otpCodeFieldInput: "border border-input rounded-[var(--radius)]",
					badge: "border border-border bg-secondary text-secondary-foreground rounded-sm",
				},
			}}
		>
			{children}
		</ClerkProvider>
	);
};
