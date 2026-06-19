import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
	// Neobrutalist base: display face, 2px ink border, hard offset shadow, and a
	// tactile press — the button translates into its shadow on hover/active.
	"inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] border-2 border-border font-display text-sm tracking-tight shadow-sm transition-[transform,box-shadow,background-color] duration-150 [transition-timing-function:var(--ease-snap)] hover:translate-x-px hover:translate-y-px hover:shadow-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary-hover",
				primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
				brand: "bg-primary text-primary-foreground hover:bg-primary-hover",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary-hover",
				destructive:
					"bg-destructive text-destructive-foreground hover:brightness-95",
				outline: "bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
				ghost: "border-transparent shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-accent hover:text-accent-foreground hover:shadow-none active:translate-x-0 active:translate-y-0",
				link: "border-transparent shadow-none text-foreground underline decoration-2 decoration-primary underline-offset-4 hover:translate-x-0 hover:translate-y-0 hover:text-primary-hover hover:shadow-none active:translate-x-0 active:translate-y-0",
				/* Canvas / connection accents (kept for compatibility) */
				"connection-prompt":
					"border-data-string bg-data-string/15 text-data-string hover:bg-data-string/25",
				"connection-image":
					"border-data-image bg-data-image/15 text-data-image hover:bg-data-image/25",
				"tool-active":
					"bg-primary text-primary-foreground hover:bg-primary-hover",
				sidebar:
					"bg-sidebar-accent text-sidebar-accent-foreground hover:bg-accent",
				"sidebar-primary":
					"bg-sidebar-primary text-sidebar-primary-foreground hover:bg-secondary-hover",
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
