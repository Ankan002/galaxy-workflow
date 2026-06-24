"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	ScrollArea,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui";
import type { gallery_item, gallery_item_type } from "@/db/prisma/browser";
import { DEBOUNCE_TIME } from "@/config/client-constants";
import { GALLERY_MAX_FILE_SIZE_BYTES } from "@/config/gallery-constants";
import {
	uploadGalleryFile,
	useGetGalleryItems,
} from "@/services/client-api/gallery";
import { useQueryClient } from "@tanstack/react-query";
import { API_ROUTES } from "@/config/client-constants";
import { Loader2, Search } from "lucide-react";
import { GalleryItemCard } from "./gallery-item-card";
import { GalleryDropzone } from "./gallery-dropzone";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (item: gallery_item) => void;
	/** Restrict browsing/uploading to one media type (e.g. image, video). */
	filterType?: gallery_item_type;
	title?: string;
}

export const FilePickerDialog = ({
	open,
	onOpenChange,
	onSelect,
	filterType,
	title = "Choose a file",
}: Props) => {
	const queryClient = useQueryClient();
	const [tab, setTab] = useState("browse");
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounce(search, DEBOUNCE_TIME);
	const [selected, setSelected] = useState<gallery_item | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useGetGalleryItems({
		query: debouncedSearch || undefined,
		type: filterType,
	});

	const items = data?.pages.flatMap((page) => page.items) ?? [];

	const sentinelRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const node = sentinelRef.current;
		if (!node || !open) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0]?.isIntersecting &&
					hasNextPage &&
					!isFetchingNextPage
				) {
					fetchNextPage();
				}
			},
			{ rootMargin: "300px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [open, hasNextPage, isFetchingNextPage, fetchNextPage]);

	// Reset transient state whenever the dialog re-opens.
	useEffect(() => {
		if (open) {
			setSelected(null);
			setSearch("");
			setTab("browse");
		}
	}, [open]);

	const handleConfirm = () => {
		if (!selected) return;
		onSelect(selected);
		onOpenChange(false);
	};

	const handleUpload = async (files: File[]) => {
		const file = files[0];
		if (!file) return;
		if (filterType && !file.type.startsWith(`${filterType}/`)) {
			toast.error(`Please choose a ${filterType} file`);
			return;
		}
		if (file.size > GALLERY_MAX_FILE_SIZE_BYTES) {
			toast.error("File exceeds the 100 MB limit");
			return;
		}
		setIsUploading(true);
		try {
			const item = await uploadGalleryFile({ file });
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.GALLERY.LIST.key],
			});
			onSelect(item);
			onOpenChange(false);
		} catch {
			toast.error(`Failed to upload ${file.name}`);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<Tabs value={tab} onValueChange={setTab}>
					<TabsList>
						<TabsTrigger value="browse">Browse</TabsTrigger>
						<TabsTrigger value="upload">Upload</TabsTrigger>
					</TabsList>

					<TabsContent value="browse" className="space-y-3">
						<InputGroup variant="search" className="h-8 w-full">
							<InputGroupInput
								placeholder="Search files"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="text-xs placeholder:text-xs"
							/>
							<InputGroupAddon align="inline-start">
								<Search className="size-3 text-muted-foreground" />
							</InputGroupAddon>
						</InputGroup>

						<ScrollArea className="h-80">
							{isLoading ? (
								<div className="grid grid-cols-3 gap-3 pr-3 sm:grid-cols-4">
									{Array.from({ length: 8 }).map((_, i) => (
										<Skeleton
											key={i}
											className="aspect-square w-full rounded-lg"
										/>
									))}
								</div>
							) : items.length === 0 ? (
								<div className="flex h-72 flex-col items-center justify-center text-center">
									<p className="font-sans text-sm text-foreground">
										No files yet
									</p>
									<p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
										Upload one from the upload tab
									</p>
								</div>
							) : (
								<div className="grid grid-cols-3 gap-3 pr-3 sm:grid-cols-4">
									{items.map((item) => (
										<GalleryItemCard
											key={item.id}
											item={item}
											selected={selected?.id === item.id}
											onClick={setSelected}
										/>
									))}
									<div
										ref={sentinelRef}
										className="col-span-full h-1"
									/>
									{isFetchingNextPage && (
										<div className="col-span-full flex justify-center py-2">
											<Loader2 className="size-4 animate-spin text-muted-foreground" />
										</div>
									)}
								</div>
							)}
						</ScrollArea>

						<div className="flex justify-end">
							<Button
								onClick={handleConfirm}
								disabled={!selected}
								className="h-8"
							>
								Use selected
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="upload">
						<GalleryDropzone
							onFiles={handleUpload}
							disabled={isUploading}
						/>
						{isUploading && (
							<div className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
								<Loader2 className="size-4 animate-spin" />
								<span className="font-mono text-[11px] uppercase">
									Uploading…
								</span>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
