"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GALLERY_ACCEPT_ATTRIBUTE } from "@/config/gallery-constants";
import { UploadCloud } from "lucide-react";

interface Props {
	onFiles: (files: File[]) => void;
	disabled?: boolean;
	className?: string;
	/** Compact variant for the picker dialog. */
	compact?: boolean;
}

export const GalleryDropzone = ({
	onFiles,
	disabled,
	className,
	compact,
}: Props) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragOver, setIsDragOver] = useState(false);

	const handleFiles = useCallback(
		(fileList: FileList | null) => {
			if (!fileList || fileList.length === 0) return;
			onFiles(Array.from(fileList));
		},
		[onFiles],
	);

	return (
		<div
			role="button"
			tabIndex={0}
			aria-label="Upload files"
			onClick={() => !disabled && inputRef.current?.click()}
			onKeyDown={(e) => {
				if ((e.key === "Enter" || e.key === " ") && !disabled) {
					e.preventDefault();
					inputRef.current?.click();
				}
			}}
			onDragOver={(e) => {
				e.preventDefault();
				if (!disabled) setIsDragOver(true);
			}}
			onDragLeave={(e) => {
				e.preventDefault();
				setIsDragOver(false);
			}}
			onDrop={(e) => {
				e.preventDefault();
				setIsDragOver(false);
				if (!disabled) handleFiles(e.dataTransfer.files);
			}}
			className={cn(
				"flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 text-center transition-colors",
				compact ? "p-6" : "p-10",
				!disabled && "cursor-pointer hover:bg-muted/40",
				isDragOver && "border-border-strong/40 bg-muted/50 ring-2 ring-ring",
				disabled && "opacity-50",
				className,
			)}
		>
			<UploadCloud
				className={cn(
					"text-muted-foreground",
					compact ? "size-6" : "size-8",
				)}
				strokeWidth={1.5}
			/>
			<div className="space-y-0.5">
				<p className="font-sans text-sm text-foreground">
					{isDragOver
						? "Drop to upload"
						: "Drag & drop or click to upload"}
				</p>
				<p className="font-mono text-[10px] uppercase text-muted-foreground">
					Images, video, pdf · up to 100 MB
				</p>
			</div>
			<input
				ref={inputRef}
				type="file"
				multiple
				accept={GALLERY_ACCEPT_ATTRIBUTE}
				onChange={(e) => {
					handleFiles(e.target.files);
					e.target.value = "";
				}}
				className="hidden"
				disabled={disabled}
			/>
		</div>
	);
};
