"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const checkboxVariants = cva(
	"peer shrink-0 rounded-sm border-2 border-border bg-card shadow-xs transition-[background-color,box-shadow] duration-150 [transition-timing-function:var(--ease-snap)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
	{
		variants: {
			variant: {
				default: "",
				brand: "data-[state=checked]:bg-primary",
			},
			size: {
				default: "size-5",
				sm: "size-4",
				lg: "size-6",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

const Checkbox = React.forwardRef<
	React.ElementRef<typeof CheckboxPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> &
		VariantProps<typeof checkboxVariants>
>(({ className, variant, size, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(checkboxVariants({ variant, size }), className)}
		{...props}
	>
		<CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
			<Check className="size-3.5" strokeWidth={3} />
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox, checkboxVariants }
