"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { PanelLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

/* ─── Constants (theme-aligned with screenshots) ─── */
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

/* ─── Context ─── */
type SidebarContext = {
	state: "expanded" | "collapsed"
	setOpen: (open: boolean) => void
	open: boolean
	openMobile: boolean
	setOpenMobile: (open: boolean) => void
	isMobile: boolean
	toggleSidebar: () => void
	collapsible: "offcanvas" | "icon" | "none"
	side: "left" | "right"
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
	const context = React.useContext(SidebarContext)
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider")
	}
	return context
}

/* ─── Provider ─── */
const SidebarProvider = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		defaultOpen?: boolean
		open?: boolean
		onOpenChange?: (open: boolean) => void
		collapsible?: "offcanvas" | "icon" | "none"
		side?: "left" | "right"
	}
>(
	(
		{
			defaultOpen = true,
			open: controlledOpen,
			onOpenChange,
			collapsible = "offcanvas",
			side = "left",
			className,
			style,
			children,
			...props
		},
		ref
	) => {
		const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
		const [openMobile, setOpenMobile] = React.useState(false)
		const open = controlledOpen ?? uncontrolledOpen
		const setOpen = React.useCallback(
			(value: boolean) => {
				if (onOpenChange) onOpenChange(value)
				else setUncontrolledOpen(value)
			},
			[onOpenChange]
		)

		const [isMobile, setIsMobile] = React.useState(false)
		React.useEffect(() => {
			const mql = window.matchMedia("(max-width: 768px)")
			const handler = () => setIsMobile(mql.matches)
			handler()
			mql.addEventListener("change", handler)
			return () => mql.removeEventListener("change", handler)
		}, [])

		const state = collapsible === "icon" ? (open ? "expanded" : "collapsed") : open ? "expanded" : "collapsed"
		const toggleSidebar = React.useCallback(() => {
			if (isMobile) setOpenMobile((v) => !v)
			else setOpen(!open)
		}, [isMobile, open, setOpen])

		React.useEffect(() => {
			const handleKey = (e: KeyboardEvent) => {
				if ((e.metaKey || e.ctrlKey) && e.key === SIDEBAR_KEYBOARD_SHORTCUT) {
					e.preventDefault()
					toggleSidebar()
				}
			}
			window.addEventListener("keydown", handleKey)
			return () => window.removeEventListener("keydown", handleKey)
		}, [toggleSidebar])

		const value: SidebarContext = {
			state: state as "expanded" | "collapsed",
			open,
			setOpen,
			openMobile,
			setOpenMobile,
			isMobile,
			toggleSidebar,
			collapsible,
			side,
		}

		return (
			<SidebarContext.Provider value={value}>
				<div
					ref={ref}
					className={cn("group/sidebar-wrapper flex h-svh min-h-svh w-full", className)}
					data-collapsible={collapsible}
					data-side={side}
					style={
						{
							"--sidebar-width": SIDEBAR_WIDTH,
							"--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
							"--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
							...style,
						} as React.CSSProperties
					}
					{...props}
				>
					{children}
				</div>
			</SidebarContext.Provider>
		)
	}
)
SidebarProvider.displayName = "SidebarProvider"

/* ─── Sidebar (main container) ─── */
const sidebarVariants = cva(
	"relative flex h-full min-h-svh flex-col bg-sidebar text-sidebar-foreground border-sidebar-border transition-[width] ease-linear",
	{
		variants: {
			side: {
				left: "border-r",
				right: "border-l",
			},
			variant: {
				sidebar: "",
				floating: "rounded-lg border shadow-lg",
				inset: "rounded-lg border",
			},
			state: {
				expanded: "w-[var(--sidebar-width)]",
				collapsed: "w-[var(--sidebar-width-icon)]",
			},
		},
		defaultVariants: {
			side: "left",
			variant: "sidebar",
			state: "expanded",
		},
	}
)

const Sidebar = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		side?: "left" | "right"
		variant?: "sidebar" | "floating" | "inset"
		collapsible?: "offcanvas" | "icon" | "none"
	}
>(({ className, side = "left", variant = "sidebar", collapsible = "offcanvas", children, ...props }, ref) => {
	const { state, isMobile, open, openMobile, setOpenMobile } = useSidebar()
	const widthState = collapsible === "icon" ? state : "expanded"

	/* Mobile offcanvas: render sheet only; SidebarTrigger elsewhere opens it */
	if (isMobile && collapsible === "offcanvas") {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile}>
				<SheetTrigger asChild className="sr-only">
					<span />
				</SheetTrigger>
				<SheetContent
					side={side}
					variant="sidebar"
					showClose={true}
					className="w-[var(--sidebar-width-mobile)] p-0 gap-0"
				>
					<SheetTitle className="sr-only">Sidebar</SheetTitle>
					<SidebarInner
						className={className}
						side={side}
						variant={variant}
						state="expanded"
						{...props}
					>
						{children}
					</SidebarInner>
				</SheetContent>
			</Sheet>
		)
	}

	/* Desktop: always render sidebar; offcanvas closed = hidden with transition */
		const isOffcanvasClosed = !isMobile && collapsible === "offcanvas" && !open
	return (
		<SidebarInner
			ref={ref}
			className={cn(
				className,
				isOffcanvasClosed && "md:w-0 md:min-w-0 md:overflow-hidden md:border-0 md:opacity-0 md:p-0"
			)}
			side={side}
			variant={variant}
			state={isMobile ? "expanded" : widthState}
			data-state={widthState}
			{...props}
		>
			{children}
		</SidebarInner>
	)
})
Sidebar.displayName = "Sidebar"

const SidebarInner = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		side?: "left" | "right"
		variant?: "sidebar" | "floating" | "inset"
		state?: "expanded" | "collapsed"
	}
>(({ className, side = "left", variant = "sidebar", state = "expanded", ...props }, ref) => (
	<div
		ref={ref}
		className={cn(sidebarVariants({ side, variant, state }), className)}
		{...props}
	/>
))
SidebarInner.displayName = "SidebarInner"

/* ─── Layout sections ─── */
const SidebarHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col gap-2 p-2", className)}
		{...props}
	/>
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col gap-2 p-2 mt-auto", className)}
		{...props}
	/>
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-1 flex-col gap-2 overflow-auto p-2", className)}
		{...props}
	/>
))
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("group/group flex w-full flex-col gap-1", className)}
		{...props}
	/>
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
	const Comp = asChild ? Slot : "div"
	return (
		<Comp
			ref={ref}
			className={cn(
				"flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-widest group-data-[collapsible=icon]/sidebar-wrapper:hidden",
				className
			)}
			{...props}
		/>
	)
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

/* ─── Menu ─── */
const SidebarMenu = React.forwardRef<
	HTMLUListElement,
	React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
	<ul ref={ref} className={cn("flex w-full flex-col gap-1", className)} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
	HTMLLIElement,
	React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
	<li ref={ref} className={cn("list-none", className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
	"flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium outline-none ring-sidebar-ring transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
				ghost: "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
			},
			size: {
				default: "h-8",
				sm: "h-7 gap-1.5 px-1.5 text-xs",
				lg: "h-9 gap-2 px-3",
			},
			ripple: {
				true: "relative overflow-hidden",
				false: "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			ripple: false,
		},
	}
)

const RIPPLE_SIZE = 200
const RIPPLE_DURATION = 0.6
const RIPPLE_EASE = [0.65, 0, 0.45, 1] as const

function useRipple(ripple: boolean | undefined) {
	const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number }[]>([])
	const elRef = React.useRef<HTMLElement | null>(null)

	const handleClick = React.useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (!ripple || !elRef.current) return
			const rect = elRef.current.getBoundingClientRect()
			setRipples((prev) => [
				...prev,
				{
					id: Date.now(),
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
				},
			])
		},
		[ripple]
	)

	const removeRipple = React.useCallback((id: number) => {
		setRipples((prev) => prev.filter((r) => r.id !== id))
	}, [])

	const setRef = React.useCallback((node: HTMLElement | null) => {
		elRef.current = node
	}, [])

	return { ripples, handleClick, removeRipple, setRef }
}

const SidebarMenuButton = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> &
		VariantProps<typeof sidebarMenuButtonVariants> & {
			asChild?: boolean
			isActive?: boolean
			tooltip?: string | React.ReactNode
		}
>(
	(
		{
			className,
			variant,
			size,
			ripple,
			asChild,
			isActive,
			tooltip,
			onClick,
			children,
			...props
		},
		ref
	) => {
		const { state } = useSidebar()
		const { ripples, handleClick, removeRipple, setRef } = useRipple(ripple ?? false)

		const mergeRef = React.useCallback(
			(node: HTMLButtonElement | null) => {
				setRef(node)
				if (typeof ref === "function") ref(node)
				else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
			},
			[ref, setRef]
		)

		const Comp = asChild && !ripple ? Slot : "button"
		const button = (
			<Comp
				ref={ripple ? mergeRef : ref}
				data-active={isActive ? "" : undefined}
				className={cn(
					sidebarMenuButtonVariants({ variant, size, ripple }),
					"group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:justify-center",
					className
				)}
				onClick={ripple ? (e) => { handleClick(e); onClick?.(e) } : onClick}
				{...props}
			>
				{children}
				{ripple && (
					<span
						className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-lg"
						style={{ width: "100%", height: "100%" }}
					>
						{ripples.map((r) => (
							<motion.span
								key={r.id}
								className="absolute rounded-full bg-current [-webkit-tap-highlight-color:transparent]"
								style={{
									left: r.x - RIPPLE_SIZE / 2,
									top: r.y - RIPPLE_SIZE / 2,
									width: RIPPLE_SIZE,
									height: RIPPLE_SIZE,
								}}
								initial={{ scale: 0, opacity: 0.35 }}
								animate={{ scale: 1, opacity: 0 }}
								transition={{
									duration: RIPPLE_DURATION,
									ease: RIPPLE_EASE,
								}}
								onAnimationComplete={() => removeRipple(r.id)}
							/>
						))}
					</span>
				)}
			</Comp>
		)
		if (state === "collapsed" && tooltip) {
			return (
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger asChild>{button}</TooltipTrigger>
						<TooltipContent side="right">{tooltip}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)
		}
		return button
	}
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		asChild?: boolean
		showOnHover?: boolean
	}
>(({ className, asChild, showOnHover, ...props }, ref) => {
	const Comp = asChild ? Slot : "button"
	return (
		<Comp
			ref={ref}
			className={cn(
				"absolute right-1 top-1.5 flex size-6 cursor-pointer items-center justify-center rounded-lg text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[color,box-shadow] hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground",
				showOnHover && "group-hover:opacity-100 opacity-0",
				className
			)}
			{...props}
		/>
	)
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuSub = React.forwardRef<
	HTMLUListElement,
	React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
	<ul
		ref={ref}
		className={cn(
			"mx-3.5 flex min-w-0 flex-col gap-1 border-l border-sidebar-border px-2.5 py-1 group-data-[collapsible=icon]:hidden",
			className
		)}
		{...props}
	/>
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
	HTMLLIElement,
	React.HTMLAttributes<HTMLLIElement>
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
	HTMLAnchorElement,
	React.AnchorHTMLAttributes<HTMLAnchorElement> & {
		asChild?: boolean
		isActive?: boolean
	}
>(({ className, asChild, isActive, ...props }, ref) => {
	const Comp = asChild ? Slot : "a"
	return (
		<Comp
			ref={ref}
			data-active={isActive ? "" : undefined}
			className={cn(
				"flex h-7 min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-sidebar-foreground/70 outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 data-active:bg-sidebar-accent data-active:text-sidebar-foreground",
				className
			)}
			{...props}
		/>
	)
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

/* ─── SidebarTrigger ─── */
const SidebarTrigger = React.forwardRef<
	React.ElementRef<typeof Button>,
	React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => {
	const { toggleSidebar } = useSidebar()
	return (
		<Button
			ref={ref}
			variant="ghost"
			size="icon"
			className={cn("cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground", className)}
			onClick={toggleSidebar}
			{...props}
		>
			<PanelLeftIcon className="size-4" />
			<span className="sr-only">Toggle Sidebar</span>
		</Button>
	)
})
SidebarTrigger.displayName = "SidebarTrigger"

/* ─── SidebarInset ─── */
const SidebarInset = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<main
		ref={ref}
		className={cn(
			"relative flex min-h-svh flex-1 flex-col min-w-0 bg-background",
			className
		)}
		{...props}
	/>
))
SidebarInset.displayName = "SidebarInset"

/* ─── SidebarRail ─── */
const SidebarRail = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
	const { toggleSidebar } = useSidebar()
	return (
		<button
			ref={ref}
			type="button"
			aria-label="Toggle Sidebar"
			title="Toggle Sidebar"
			className={cn(
				"absolute right-0 top-0 z-10 flex h-full w-3 cursor-pointer translate-x-full items-center justify-center border-sidebar-border bg-sidebar text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-sidebar-border",
				"group-data-[collapsible=icon]/sidebar-wrapper:flex group-data-[side=right]/sidebar-wrapper:translate-x-full group-data-[side=right]/sidebar-wrapper:after:left-full group-data-[side=right]/sidebar-wrapper:after:right-0",
				"hidden md:flex",
				className
			)}
			onClick={toggleSidebar}
			{...props}
		>
			<div className="flex h-8 w-3 items-center justify-center rounded-l-lg bg-sidebar-accent" />
		</button>
	)
})
SidebarRail.displayName = "SidebarRail"

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
	SIDEBAR_KEYBOARD_SHORTCUT,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
	SIDEBAR_WIDTH_MOBILE,
	useSidebar,
	sidebarVariants,
	sidebarMenuButtonVariants,
}
