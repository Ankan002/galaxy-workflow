import { cn } from "@/lib/utils"

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-[var(--radius)] border border-border/60 bg-muted",
				className
			)}
			{...props}
		/>
	)
}

export { Skeleton }
