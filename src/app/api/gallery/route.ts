import {
	createGalleryItem,
	getGalleryItems,
} from "@/db/actions/gallery-item.action";
import { getUserByClerkId } from "@/db/actions/user.action";
import { serverUtilsRegistry } from "@/utils/server";
import { extensionFromFilename } from "@/lib/s3";
import {
	GALLERY_ACCEPTED_MIME_TYPES,
	GALLERY_MAX_FILE_SIZE_BYTES,
	resolveGalleryItemType,
} from "@/config/gallery-constants";
import { ApiError } from "@/types/errors/api-error";
import type { gallery_item } from "@/db/prisma/client";
import z from "zod";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

/* -------------------------------- List (GET) ------------------------------- */

const querySchema = z.object({
	query: z.string().optional(),
	type: z.enum(["image", "video", "document", "others"]).optional(),
	cursor: z.string().optional(),
});

interface ListGalleryResponseData {
	items: gallery_item[];
	nextCursor: string | null;
}

export const GET = createApi<undefined, typeof querySchema, true>({
	requireAuth: true,
	querySchema,
	execute: async ({ query, user }) => {
		const { items, nextCursor } = await getGalleryItems({
			clerkUserId: user!.id,
			search: query?.query,
			type: query?.type,
			cursor: query?.cursor,
		});

		return sendJsonApiResponse<ListGalleryResponseData>({
			code: 200,
			success: true,
			data: { items: items as gallery_item[], nextCursor },
		});
	},
});

/* ----------------------------- Confirm (POST) ------------------------------ */

const bodySchema = z.object({
	name: z.string().min(1).max(255),
	key: z.string().min(1),
	contentType: z.enum(GALLERY_ACCEPTED_MIME_TYPES),
	size: z.number().int().positive().max(GALLERY_MAX_FILE_SIZE_BYTES),
});

interface CreateGalleryResponseData {
	item: gallery_item;
}

export const POST = createApi<typeof bodySchema, undefined, true>({
	requireAuth: true,
	bodySchema,
	execute: async ({ body, user }) => {
		const internalUser = await getUserByClerkId(user!.id);
		if (!internalUser) {
			throw new ApiError("User not found", 404);
		}

		// The key must live under the caller's own prefix (set when presigning).
		if (!body!.key.startsWith(`${internalUser.id}/`)) {
			throw new ApiError("Invalid object key", 400);
		}

		const item = await createGalleryItem({
			clerkUserId: user!.id,
			type: resolveGalleryItemType(body!.contentType),
			name: body!.name,
			key: body!.key,
			url: serverUtilsRegistry.s3.getPublicUrl(body!.key),
			extension: extensionFromFilename(body!.name),
			mimeType: body!.contentType,
			size: body!.size,
		});

		return sendJsonApiResponse<CreateGalleryResponseData>({
			code: 201,
			success: true,
			data: { item },
		});
	},
});
