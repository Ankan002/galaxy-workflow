"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import type { gallery_item } from "@/db/prisma/browser";
import { API_ROUTES, DEBOUNCE_TIME } from "@/config/client-constants";
import {
	GALLERY_ACCEPTED_MIME_TYPES,
	GALLERY_MAX_FILE_SIZE_BYTES,
	type GalleryTypeFilter,
} from "@/config/gallery-constants";
import { clientUtils } from "@/utils/client";
import { useAPIErrorHandler } from "@/hooks/use-error-handler";
import {
	uploadGalleryFile,
	useDeleteGalleryItem,
	useGetGalleryItems,
} from "@/services/client-api/gallery";
import { useQueryClient } from "@tanstack/react-query";

export interface ActiveUpload {
	id: string;
	name: string;
	progress: number;
}

const ACCEPTED = new Set<string>(GALLERY_ACCEPTED_MIME_TYPES);

const validateFile = (file: File): string | null => {
	if (!ACCEPTED.has(file.type)) return `Unsupported file type: ${file.name}`;
	if (file.size > GALLERY_MAX_FILE_SIZE_BYTES)
		return `${file.name} exceeds the 100 MB limit`;
	return null;
};

export const useGallery = () => {
	const { APIErrorHandler } = useAPIErrorHandler();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounce(search, DEBOUNCE_TIME);
	const [typeFilter, setTypeFilter] = useState<GalleryTypeFilter>("all");
	const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);

	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useGetGalleryItems({
		query: debouncedSearch || undefined,
		type: typeFilter === "all" ? undefined : typeFilter,
	});

	const { mutateAsync: deleteItem } = useDeleteGalleryItem();

	const items = useMemo(
		() => data?.pages.flatMap((page) => page.items) ?? [],
		[data],
	);

	const getErrorHandler = APIErrorHandler();
	const deleteErrorHandler = APIErrorHandler();

	useEffect(() => {
		if (error) getErrorHandler(error);
	}, [error, getErrorHandler]);

	const handleUploadFiles = useCallback(
		async (files: File[]) => {
			const valid: File[] = [];
			for (const file of files) {
				const err = validateFile(file);
				if (err) toast.error(err);
				else valid.push(file);
			}
			if (valid.length === 0) return;

			await Promise.all(
				valid.map(async (file) => {
					const uploadId = `${file.name}-${Date.now()}-${Math.random()}`;
					setActiveUploads((prev) => [
						...prev,
						{ id: uploadId, name: file.name, progress: 0 },
					]);
					try {
						await uploadGalleryFile({
							file,
							onProgress: (progress) =>
								setActiveUploads((prev) =>
									prev.map((u) =>
										u.id === uploadId ? { ...u, progress } : u,
									),
								),
						});
					} catch {
						toast.error(`Failed to upload ${file.name}`);
					} finally {
						setActiveUploads((prev) =>
							prev.filter((u) => u.id !== uploadId),
						);
					}
				}),
			);

			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.GALLERY.LIST.key],
			});
			toast.success("Upload complete");
		},
		[queryClient],
	);

	const handleDelete = useCallback(
		async (item: gallery_item) => {
			try {
				await deleteItem(item.id);
				toast.success("File deleted");
			} catch (e) {
				deleteErrorHandler(e);
			}
		},
		[deleteItem, deleteErrorHandler],
	);

	/* ------------------------- Infinite scroll sentinel ------------------------ */

	const sentinelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const node = sentinelRef.current;
		if (!node) return;
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
			{ rootMargin: "400px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	return {
		items,
		isLoading,
		isFetchingNextPage,
		hasNextPage,
		sentinelRef,
		search,
		onSearchChange:
			clientUtils.uiEventsHandler.onTextInputChange(setSearch),
		typeFilter,
		setTypeFilter,
		activeUploads,
		handleUploadFiles,
		handleDelete,
	};
};
