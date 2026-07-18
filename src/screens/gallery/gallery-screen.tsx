"use client";

import { DashboardProvider } from "@/components/providers";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Progress,
	Skeleton,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@/components/ui";
import { GalleryDropzone, GalleryItemCard } from "@/components/gallery";
import { GALLERY_TYPE_FILTERS, type GalleryTypeFilter } from "@/config/gallery-constants";
import { Images, Loader2, Search } from "lucide-react";
import { useGallery } from "./hook";

const FILTER_LABELS: Record<GalleryTypeFilter, string> = {
	all: "All",
	image: "Images",
	video: "Videos",
	document: "Documents",
	others: "Others",
};

const GalleryScreen = () => {
	const {
		items,
		isLoading,
		isFetchingNextPage,
		sentinelRef,
		search,
		onSearchChange,
		typeFilter,
		setTypeFilter,
		activeUploads,
		handleUploadFiles,
		handleDelete,
	} = useGallery();

	const isEmpty = !isLoading && items.length === 0;

	return (
		<DashboardProvider heading="Gallery">
			<GalleryDropzone onFiles={handleUploadFiles} />

			{activeUploads.length > 0 && (
				<div className="mt-4 flex flex-col gap-2">
					{activeUploads.map((upload) => (
						<div
							key={upload.id}
							className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
						>
							<Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
							<span className="truncate font-sans text-xs text-foreground">
								{upload.name}
							</span>
							<Progress
								value={upload.progress}
								className="ml-auto h-1.5 w-32"
							/>
						</div>
					))}
				</div>
			)}

			<div className="mt-6 flex items-center justify-between gap-3">
				<Tabs
					value={typeFilter}
					onValueChange={(v) =>
						setTypeFilter(v as GalleryTypeFilter)
					}
				>
					<TabsList>
						{GALLERY_TYPE_FILTERS.map((filter) => (
							<TabsTrigger key={filter} value={filter}>
								{FILTER_LABELS[filter]}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<InputGroup variant="search" className="h-8 w-44">
					<InputGroupInput
						placeholder="Search"
						value={search}
						onChange={onSearchChange}
						className="text-xs placeholder:text-xs"
					/>
					<InputGroupAddon align="inline-start">
						<Search className="size-3 text-muted-foreground" />
					</InputGroupAddon>
				</InputGroup>
			</div>

			{isLoading ? (
				<div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
					{Array.from({ length: 15 }).map((_, i) => (
						<Skeleton
							key={i}
							className="aspect-square w-full rounded-lg"
						/>
					))}
				</div>
			) : isEmpty ? (
				<div className="flex flex-1 flex-col items-center justify-center py-16">
					<Images
						size={40}
						strokeWidth={1.5}
						className="text-muted-foreground"
					/>
					<p className="mt-5 font-display text-2xl tracking-tight">
						{search ? "No matches" : "Your gallery is empty"}
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{search
							? "Try a different search."
							: "Drag a file above to upload your first asset."}
					</p>
				</div>
			) : (
				<>
					<div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
						{items.map((item) => (
							<GalleryItemCard
								key={item.id}
								item={item}
								onDelete={handleDelete}
							/>
						))}
					</div>
					<div ref={sentinelRef} className="h-1" />
					{isFetchingNextPage && (
						<div className="flex justify-center py-4">
							<Loader2 className="size-5 animate-spin text-muted-foreground" />
						</div>
					)}
				</>
			)}
		</DashboardProvider>
	);
};

export default GalleryScreen;
