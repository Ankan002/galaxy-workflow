"use client";

import { WorkflowIcon } from "@/components/elements";
import { Card } from "@/components/ui";
import type { workflow_file } from "@/db/prisma/browser";
import { cn, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export type WorkflowFileCardProps = {
	file: workflow_file;
	/** Optional link destination (e.g. `/file/${file.id}`). When set, the card is rendered as a link. */
	href?: string;
	/** Optional click handler when not using href. */
	onClick?: () => void;
	className?: string;
};

const cardClassName =
	"flex min-h-[180px] w-full flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 p-4 shadow transition-colors hover:border-zinc-600 hover:bg-zinc-800/90";

export const WorkflowFileCard = ({
	file,
	href,
	onClick,
	className,
}: WorkflowFileCardProps) => {
	const lastEdited = formatRelativeTime(new Date(file.updated_at));

	const cardContent = (
		<div className="flex min-h-[180px] flex-col items-center justify-center">
			<WorkflowIcon className="size-16 text-white" />
		</div>
	);

	const textContent = (
		<div className="mt-3 flex flex-col gap-0.5 text-left">
			<p className="text-sm leading-none text-foreground">{file.name}</p>
			<p className="text-xs text-muted-foreground">
				Last edited {lastEdited}
			</p>
		</div>
	);

	if (href) {
		return (
			<Link href={href} className={cn("block", className)}>
				<Card
					variant="file-item"
					padding="none"
					className={cn(cardClassName, "cursor-pointer")}
				>
					{cardContent}
				</Card>
				{textContent}
			</Link>
		);
	}

	return (
		<div className={className}>
			<Card
				variant="file-item"
				padding="none"
				className={cn(cardClassName, "cursor-pointer")}
				onClick={onClick}
				role={onClick ? "button" : undefined}
				tabIndex={onClick ? 0 : undefined}
				onKeyDown={
					onClick
						? (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onClick();
								}
							}
						: undefined
				}
			>
				{cardContent}
			</Card>
			{textContent}
		</div>
	);
};

export default WorkflowFileCard;
