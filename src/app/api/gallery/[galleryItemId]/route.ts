import {
	deleteGalleryItem,
	getGalleryItemById,
} from "@/db/actions/gallery-item.action";
import { serverUtilsRegistry } from "@/utils/server";
import { ApiError } from "@/types/errors/api-error";

const { createApi, sendJsonApiResponse, s3 } = serverUtilsRegistry;

interface DeleteGalleryResponseData {
	id: string;
}

export const DELETE = createApi<undefined, undefined, true>({
	requireAuth: true,
	execute: async ({ user, params }) => {
		const galleryItemId = params?.galleryItemId;
		if (!galleryItemId) {
			throw new ApiError("Invalid gallery item id", 400);
		}

		const item = await getGalleryItemById(galleryItemId);
		if (!item) {
			throw new ApiError("Gallery item not found", 404);
		}
		if (item.user.clerk_id !== user!.id) {
			throw new ApiError("Forbidden", 403);
		}

		// Remove the S3 object first; the DB row is the source of truth for the UI.
		await s3.deleteObject(item.key);
		await deleteGalleryItem(galleryItemId);

		return sendJsonApiResponse<DeleteGalleryResponseData>({
			code: 200,
			success: true,
			data: { id: galleryItemId },
		});
	},
});
