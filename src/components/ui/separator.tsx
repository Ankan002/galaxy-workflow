"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const separatorVariants = cva("shrink-0 bg-border", {
	variants: {
		orientation: {
			vertical: "h-full w-0.5",
			horizontal: "h-0.5 w-full",
		},
		decorative: {
			true: "pointer-events-none",
			false: "",
		},
		variant: {
			default: "",
			muted: "bg-muted",
			sidebar: "bg-sidebar-border",
		},
	},
	defaultVariants: {
		orientation: "horizontal",
		decorative: true,
		variant: "default",
	},
})

const Separator = React.forwardRef<
	React.ElementRef<typeof SeparatorPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> &
		VariantProps<typeof separatorVariants>
>(
	(
		{ className, orientation = "horizontal", decorative = true, variant, ...props },
		ref
	) => (
		<SeparatorPrimitive.Root
			ref={ref}
			decorative={decorative}
			orientation={orientation}
			className={cn(separatorVariants({ orientation, decorative, variant }), className)}
			{...props}
		/>
	)
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator, separatorVariants }
