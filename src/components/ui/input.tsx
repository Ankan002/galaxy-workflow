import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
	"flex h-9 w-full rounded-[var(--radius)] border-2 border-input bg-card px-3 py-1 text-sm shadow-xs transition-[box-shadow,border-color] duration-150 [transition-timing-function:var(--ease-snap)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:text-destructive",
	{
		variants: {
			variant: {
				default: "",
				search: "bg-card placeholder:text-muted-foreground",
				sidebar: "border-sidebar-border bg-sidebar text-sidebar-foreground",
				ghost: "border-transparent bg-transparent shadow-none focus-visible:shadow-none focus-visible:border-transparent",
				error: "border-destructive text-destructive focus-visible:border-destructive",
			},
			inputSize: {
				default: "h-9",
				sm: "h-8 px-2.5 text-xs",
				lg: "h-11 px-3.5 text-base",
			},
		},
		defaultVariants: {
			variant: "default",
			inputSize: "default",
		},
	}
)

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
		VariantProps<typeof inputVariants> {
	inputSize?: "default" | "sm" | "lg"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, variant, inputSize, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(inputVariants({ variant, inputSize }), className)}
				ref={ref}
				{...props}
			/>
		)
	}
)
Input.displayName = "Input"

export { Input, inputVariants }
