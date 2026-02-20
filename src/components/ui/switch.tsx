"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const switchVariants = cva(
	"peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
	{
		variants: {
			variant: {
				default: "",
				brand: "data-[state=checked]:bg-brand",
			},
			size: {
				default: "size-9",
				sm: "size-7",
				lg: "size-11",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

const Switch = React.forwardRef<
	React.ElementRef<typeof SwitchPrimitives.Root>,
	React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> &
		VariantProps<typeof switchVariants>
>(({ className, variant, size, ...props }, ref) => (
	<SwitchPrimitives.Root
		ref={ref}
		className={cn(switchVariants({ variant, size }), className)}
		{...props}
	>
		<SwitchPrimitives.Thumb
			className={cn(
				"pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
				size === "sm" && "size-3 data-[state=checked]:translate-x-3",
				size === "lg" && "size-5 data-[state=checked]:translate-x-6"
			)}
		/>
	</SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch, switchVariants }
