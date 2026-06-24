"use client";

import type { gallery_item_type } from "@/db/prisma/browser";
import { cn } from "@/lib/utils";
import { FileText, Film, ImageIcon, Paperclip } from "lucide-react";

interface Props {
	type: gallery_item_type;
	url: string;
	name: string;
	className?: string;
}

/** Type-aware preview: images render inline, videos as a <video>, others as an icon. */
export const FileThumbnail = ({ type, url, name, className }: Props) => {
	if (type === "image") {
		return (
			// eslint-disable-next-line @next/next/no-img-element -- S3 URLs are dynamic; next/image requires remote config
			<img
				src={url}
				alt={name}
				loading="lazy"
				className={cn(
					"size-full object-cover pointer-events-none",
					className,
				)}
			/>
		);
	}

	if (type === "video") {
		return (
			<video
				src={url}
				muted
				playsInline
				preload="metadata"
				className={cn("size-full object-cover", className)}
			/>
		);
	}

	const Icon = type === "document" ? FileText : Paperclip;

	return (
		<div
			className={cn(
				"flex size-full flex-col items-center justify-center gap-1 text-muted-foreground",
				className,
			)}
		>
			<Icon className="size-8" strokeWidth={1.5} />
		</div>
	);
};

/** Small inline icon for a gallery item type (used in lists/badges). */
export const fileTypeIcon = (type: gallery_item_type) => {
	switch (type) {
		case "image":
			return ImageIcon;
		case "video":
			return Film;
		case "document":
			return FileText;
		default:
			return Paperclip;
	}
};
