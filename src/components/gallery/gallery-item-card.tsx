"use client";

import {
	Card,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui";
import type { gallery_item } from "@/db/prisma/browser";
import { cn, formatFileSize, formatRelativeTime } from "@/lib/utils";
import { Check, Copy, Trash2 } from "lucide-react";
import { FileThumbnail } from "./file-thumbnail";

export interface GalleryItemCardProps {
	item: gallery_item;
	/** Click handler — used by the picker to select an item. */
	onClick?: (item: gallery_item) => void;
	/** Called when "Delete" is chosen. When unset, no delete menu entry shows. */
	onDelete?: (item: gallery_item) => void;
	/** Highlight as the selected item (picker). */
	selected?: boolean;
	className?: string;
}

export const GalleryItemCard = ({
	item,
	onClick,
	onDelete,
	selected,
	className,
}: GalleryItemCardProps) => {
	const card = (
		<div className={cn("group flex flex-col", className)}>
			<Card
				variant="file-item"
				padding="none"
				className={cn(
					"relative aspect-square w-full overflow-hidden bg-muted/40",
					onClick && "cursor-pointer",
					selected && "ring-2 ring-ring",
				)}
				onClick={onClick ? () => onClick(item) : undefined}
				role={onClick ? "button" : undefined}
				tabIndex={onClick ? 0 : undefined}
				onKeyDown={
					onClick
						? (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onClick(item);
								}
							}
						: undefined
				}
			>
				<FileThumbnail
					type={item.type}
					url={item.url}
					name={item.name}
				/>
				{selected && (
					<div className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
						<Check className="size-3" />
					</div>
				)}
			</Card>
			<div className="mt-2 flex flex-col gap-0.5 text-left">
				<p className="truncate font-sans text-xs font-medium leading-none text-foreground">
					{item.name}
				</p>
				<p className="font-mono text-[10px] uppercase text-muted-foreground">
					{formatFileSize(item.size)} ·{" "}
					{formatRelativeTime(new Date(item.created_at))}
				</p>
			</div>
		</div>
	);

	if (!onDelete) return card;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onSelect={() => navigator.clipboard.writeText(item.url)}
				>
					<Copy className="size-4" />
					Copy URL
				</ContextMenuItem>
				<ContextMenuItem
					className="text-destructive focus:text-destructive"
					onSelect={() => onDelete(item)}
				>
					<Trash2 className="size-4" />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
