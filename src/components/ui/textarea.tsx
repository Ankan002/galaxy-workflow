import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
	"flex min-h-[76px] w-full resize-y rounded-[var(--radius)] border-2 border-input bg-card px-3 py-2 text-sm shadow-xs transition-[box-shadow,border-color] duration-150 [transition-timing-function:var(--ease-snap)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default: "",
				ghost: "border-transparent bg-transparent shadow-none focus-visible:shadow-none focus-visible:border-transparent",
				node: "resize-none bg-card",
				error: "border-destructive text-destructive focus-visible:border-destructive",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, variant, ...props }, ref) => {
		return (
			<textarea
				className={cn(textareaVariants({ variant }), className)}
				ref={ref}
				{...props}
			/>
		)
	}
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
