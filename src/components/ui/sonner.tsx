"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Sonner Toaster in the aakriti neobrutalist language: 2px ink border, hard
 * offset shadow, tight radius. Follows the active next-themes theme.
 */
const Toaster = ({ ...props }: ToasterProps) => {
	const { resolvedTheme } = useTheme()

	return (
		<Sonner
			theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-md group-[.toaster]:rounded-md",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:border group-[.toast]:border-border group-[.toast]:rounded-[var(--radius)]",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-[var(--radius)]",
					success:
						"group-[.toaster]:[--success-icon:var(--status-completed)]",
					error: "group-[.toaster]:[--error-icon:var(--destructive)]",
					warning: "group-[.toaster]:[--warning-icon:var(--warning)]",
					info: "group-[.toaster]:[--info-icon:var(--data-file)]",
				},
			}}
			{...props}
		/>
	)
}

export { Toaster }
