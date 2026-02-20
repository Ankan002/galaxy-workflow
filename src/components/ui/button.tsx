import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/80",
				primary:
					"bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/80",
				brand:
					"bg-brand text-brand-foreground shadow hover:bg-brand/90 active:bg-brand/80",
				destructive:
					"bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 active:bg-destructive/80",
				outline:
					"border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
				secondary:
					"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/70",
				ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
				link: "text-primary underline-offset-4 hover:underline",
				/* Workflow / connection variants (screenshots) */
				"connection-prompt":
					"bg-connection-prompt/20 text-connection-prompt border border-connection-prompt/40 hover:bg-connection-prompt/30",
				"connection-image":
					"bg-connection-image/20 text-connection-image border border-connection-image/40 hover:bg-connection-image/30",
				"tool-active":
					"bg-tool-active text-brand-foreground shadow hover:bg-tool-active/90",
				sidebar:
					"bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80",
				"sidebar-primary":
					"bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md gap-1.5 px-3 text-xs",
				lg: "h-10 rounded-md px-8 text-base",
				icon: "size-9",
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
