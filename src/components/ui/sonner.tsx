"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Sonner Toaster aligned with the app UI theme (globals.css).
 * Uses semantic tokens: background, foreground, border, primary, muted,
 * destructive, and brand for consistent dark-theme toasts.
 */
const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			theme="dark"
			className="toaster group"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-brand group-[.toast]:text-brand-foreground group-[.toast]:rounded-md",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
					success:
						"group-[.toaster]:border-chart-4/50 group-[.toaster]:bg-card group-[.toaster]:[--success-icon]:text-chart-4",
					error:
						"group-[.toaster]:border-destructive/50 group-[.toaster]:bg-card group-[.toaster]:[--error-icon]:text-destructive",
					warning:
						"group-[.toaster]:border-chart-3/50 group-[.toaster]:bg-card group-[.toaster]:[--warning-icon]:text-chart-3",
					info: "group-[.toaster]:border-primary/50 group-[.toaster]:bg-card",
				},
			}}
			{...props}
		/>
	)
}

export { Toaster }
