import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
	// Neobrutalist surface: 2px ink border, subtle hard offset shadow, tight radius.
	"rounded-md border-2 border-border bg-card text-card-foreground shadow-sm",
	{
		variants: {
			variant: {
				default: "",
				flat: "shadow-none",
				/* Pressable file/template card — presses into its shadow on hover */
				pressable:
					"cursor-pointer transition-[transform,box-shadow] duration-150 [transition-timing-function:var(--ease-snap)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-sm",
				/* Image thumbnail (workflow library cards) */
				"image-thumbnail":
					"overflow-hidden cursor-pointer transition-[transform,box-shadow] duration-150 [transition-timing-function:var(--ease-snap)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-sm",
				/* File/item card (My files) */
				"file-item":
					"cursor-pointer transition-[transform,box-shadow] duration-150 [transition-timing-function:var(--ease-snap)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-sm",
				/* Workflow node card — tempered shadow so the dense canvas stays legible */
				node: "shadow-sm",
				/* Selected / active node */
				selected: "shadow-sm ring-2 ring-primary",
				/* Hero / featured surface — colored marigold shadow */
				brand: "shadow-brand",
				outline: "shadow-none",
				elevated: "shadow-lg",
			},
			padding: {
				none: "p-0",
				sm: "p-3",
				default: "p-6",
				lg: "p-8",
			},
		},
		defaultVariants: {
			variant: "default",
			padding: "default",
		},
	}
)

const Card = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, padding, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(cardVariants({ variant, padding }), className)}
		{...props}
	/>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5", className)}
		{...props}
	/>
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn("font-display text-lg leading-none tracking-tight", className)}
		{...props}
	/>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-sm text-muted-foreground", className)}
		{...props}
	/>
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center pt-0", className)}
		{...props}
	/>
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
