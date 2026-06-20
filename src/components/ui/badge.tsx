import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-xs font-bold leading-none whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground",
				secondary: "bg-secondary text-secondary-foreground",
				destructive: "bg-destructive text-destructive-foreground",
				outline: "bg-transparent text-foreground",
				muted: "border-muted-foreground bg-muted text-muted-foreground",
				brand: "bg-primary text-primary-foreground",
				/* Canvas / connection accents */
				"connection-prompt":
					"border-data-string bg-data-string/15 text-data-string",
				"connection-image":
					"border-data-image bg-data-image/15 text-data-image",
				success: "bg-status-completed text-white",
				warning: "bg-primary text-primary-foreground",
			},
			size: {
				default: "",
				lg: "px-3 py-1 text-sm",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant, size }), className)} {...props} />
	)
}

export { Badge, badgeVariants }
