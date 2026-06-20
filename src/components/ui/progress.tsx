"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
	"relative h-4 w-full overflow-hidden rounded-full border border-border bg-muted",
	{
		variants: {
			variant: {
				default: "",
				brand: "",
				destructive: "",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> &
		VariantProps<typeof progressVariants>
>(({ className, value, variant, ...props }, ref) => (
	<ProgressPrimitive.Root
		ref={ref}
		className={cn(progressVariants({ variant }), className)}
		{...props}
	>
		<ProgressPrimitive.Indicator
			className={cn(
				"h-full w-full flex-1 border-r-2 border-border bg-primary transition-all duration-300 [transition-timing-function:var(--ease-out)]",
				variant === "destructive" && "bg-destructive"
			)}
			style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
		/>
	</ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress, progressVariants }
