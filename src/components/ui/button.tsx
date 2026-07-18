import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
	// Minimalist base: editorial sans, 1px hairline, no shadow, no press —
	// interaction reads through a quiet color shift only.
	"inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] border font-sans font-medium text-sm transition-[color,background-color,border-color,transform] duration-150 [transition-timing-function:var(--ease-snap)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				/* Monochrome ink CTA */
				default:
					"border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
				primary:
					"border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
				/* The rare marigold moment */
				brand: "border-transparent bg-highlight text-highlight-foreground hover:bg-[var(--ak-marigold-deep)]",
				highlight:
					"border-transparent bg-highlight text-highlight-foreground hover:bg-[var(--ak-marigold-deep)]",
				secondary:
					"border-border bg-secondary text-secondary-foreground hover:bg-secondary-hover",
				destructive:
					"border-transparent bg-destructive text-destructive-foreground hover:brightness-95",
				outline:
					"border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
				ghost: "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground",
				link: "border-transparent text-foreground underline decoration-1 underline-offset-4 hover:text-muted-foreground",
				/* Canvas / connection accents (kept for compatibility) */
				"connection-prompt":
					"border-data-string bg-data-string/15 text-data-string hover:bg-data-string/25",
				"connection-image":
					"border-data-image bg-data-image/15 text-data-image hover:bg-data-image/25",
				"tool-active":
					"border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
				sidebar:
					"border-transparent bg-sidebar-accent text-sidebar-accent-foreground hover:bg-accent",
				"sidebar-primary":
					"border-transparent bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 gap-1.5 px-3 text-xs",
				lg: "h-11 px-6 text-base",
				icon: "size-9",
				"icon-xs": "size-7",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button"
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		)
	}
)
Button.displayName = "Button"

export { Button, buttonVariants }
