"use client";

import { WorkflowIcon } from "@/components/elements";
import {
	Card,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui";
import type { workflow_file } from "@/db/prisma/browser";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export type WorkflowFileCardProps = {
	file: workflow_file;
	/** Optional link destination (e.g. `/file/${file.id}`). When set, the card is rendered as a link. */
	href?: string;
	/** Optional click handler when not using href. */
	onClick?: () => void;
	/** Called when user chooses "Rename" from the context menu. */
	onRename?: (file: workflow_file) => void;
	/** Called when user chooses "Delete workflow" from the context menu. When not provided, no context menu is shown. */
	onDelete?: (workflowId: string) => void;
	className?: string;
};

const cardClassName = "flex min-h-[180px] w-full flex-col overflow-hidden p-3";

export const WorkflowFileCard = ({
	file,
	href,
	onClick,
	onRename,
	onDelete,
	className,
}: WorkflowFileCardProps) => {
	const lastEdited = formatRelativeTime(new Date(file.updated_at));

	const cardContent = (
		<div className="flex min-h-[180px] w-full items-center justify-center rounded-md border border-border bg-muted/40 transition-colors group-hover:bg-accent/30">
			<WorkflowIcon className="size-12 text-muted-foreground transition group-hover:text-foreground" />
		</div>
	);

	const textContent = (
		<div className="mt-3 flex flex-col gap-1 text-left">
			<p className="font-sans font-medium text-sm leading-none text-foreground truncate">
				{file.name}
			</p>
			<p className="font-mono text-[11px] text-muted-foreground">
				Last edited {lastEdited}
			</p>
		</div>
	);

	const wrapWithContextMenu = (children: React.ReactNode) => {
		if (!onRename && !onDelete) return children;
		return (
			<ContextMenu>
				<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
				<ContextMenuContent>
					{onRename && (
						<ContextMenuItem onSelect={() => onRename(file)}>
							<Pencil className="size-4" />
							Rename
						</ContextMenuItem>
					)}
					{onDelete && (
						<ContextMenuItem
							className="text-destructive focus:text-destructive"
							onSelect={() => onDelete(file.id)}
						>
							<Trash2 className="size-4" />
							Delete workflow
						</ContextMenuItem>
					)}
				</ContextMenuContent>
			</ContextMenu>
		);
	};

	if (href) {
		return wrapWithContextMenu(
			<Link href={href} className={cn("block group", className)}>
				<Card
					variant="file-item"
					padding="none"
					className={cn(cardClassName, "cursor-pointer")}
				>
					{cardContent}
				</Card>
				{textContent}
			</Link>,
		);
	}

	return wrapWithContextMenu(
		<div className={cn("group", className)}>
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
		</div>,
	);
};

export default WorkflowFileCard;
