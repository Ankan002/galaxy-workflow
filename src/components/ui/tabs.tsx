"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva(
	"inline-flex items-center justify-center rounded-md text-muted-foreground",
	{
		variants: {
			variant: {
				default: "bg-muted p-1",
				underline:
					"border-b border-border bg-transparent p-0 gap-8 min-h-[2.25rem]",
				sidebar: "flex flex-col gap-1 bg-sidebar",
				pill: "bg-muted/50 p-1 rounded-full",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
		VariantProps<typeof tabsListVariants>
>(({ className, variant, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(tabsListVariants({ variant }), className)}
		{...props}
	/>
))
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
	{
		variants: {
			variant: {
				default: "",
				underline:
					"rounded-none border-b-2 border-transparent pb-3 pt-0.5 text-muted-foreground transition-colors duration-200 hover:text-foreground/80 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-[2px]",
				sidebar:
					"data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground",
				brand:
					"data-[state=active]:bg-brand data-[state=active]:text-brand-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
		VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(tabsTriggerVariants({ variant }), className)}
		{...props}
	/>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			className
		)}
		{...props}
	/>
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
