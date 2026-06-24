import type { gallery_item_type } from "@/db/prisma/client";
import { GALLERY_PAGE_SIZE } from "@/config/gallery-constants";
import { prisma } from "../client";

interface CreateGalleryItemArgs {
	clerkUserId: string;
	type: gallery_item_type;
	name: string;
	key: string;
	url: string;
	extension: string;
	mimeType: string;
	size: number;
}

export const createGalleryItem = async (args: CreateGalleryItemArgs) => {
	return prisma.gallery_item.create({
		data: {
			user: { connect: { clerk_id: args.clerkUserId } },
			type: args.type,
			name: args.name,
			key: args.key,
			url: args.url,
			extension: args.extension,
			mime_type: args.mimeType,
			size: args.size,
		},
	});
};

interface GetGalleryItemsArgs {
	clerkUserId: string;
	search?: string;
	type?: gallery_item_type;
	/** Gallery item id to page after (exclusive). */
	cursor?: string;
	limit?: number;
}

export interface GetGalleryItemsResult {
	items: Awaited<ReturnType<typeof prisma.gallery_item.findMany>>;
	nextCursor: string | null;
}

/**
 * Cursor-paginated gallery listing for the current user. Orders newest-first
 * and over-fetches one row to compute the next cursor.
 */
export const getGalleryItems = async (
	args: GetGalleryItemsArgs,
): Promise<GetGalleryItemsResult> => {
	const limit = args.limit ?? GALLERY_PAGE_SIZE;

	const items = await prisma.gallery_item.findMany({
		where: {
			user: { clerk_id: args.clerkUserId },
			type: args.type,
			name: args.search
				? { contains: args.search, mode: "insensitive" }
				: undefined,
		},
		orderBy: [{ created_at: "desc" }, { id: "desc" }],
		take: limit + 1,
		...(args.cursor
			? { cursor: { id: args.cursor }, skip: 1 }
			: {}),
	});

	const hasMore = items.length > limit;
	const page = hasMore ? items.slice(0, limit) : items;
	const nextCursor = hasMore ? page[page.length - 1].id : null;

	return { items: page, nextCursor };
};

export const getGalleryItemById = async (id: string) =>
	prisma.gallery_item.findUnique({
		where: { id },
		include: { user: true },
	});

export const deleteGalleryItem = async (id: string) =>
	prisma.gallery_item.delete({
		where: { id },
	});
