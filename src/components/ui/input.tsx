import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
	"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-[color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
	{
		variants: {
			variant: {
				default: "",
				search:
					"bg-input/80 placeholder:text-muted-foreground",
				sidebar: "border-sidebar-border bg-sidebar/80 text-sidebar-foreground",
				ghost: "border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
				error: "border-destructive focus-visible:ring-destructive",
			},
			inputSize: {
				default: "h-9",
				sm: "h-8 text-sm",
				lg: "h-10 text-base",
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
