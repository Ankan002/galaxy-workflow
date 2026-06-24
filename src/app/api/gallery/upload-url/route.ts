import { getUserByClerkId } from "@/db/actions/user.action";
import { serverUtilsRegistry } from "@/utils/server";
import { extensionFromFilename } from "@/lib/s3";
import {
	GALLERY_ACCEPTED_MIME_TYPES,
	GALLERY_MAX_FILE_SIZE_BYTES,
} from "@/config/gallery-constants";
import { ApiError } from "@/types/errors/api-error";
import z from "zod";

const { createApi, sendJsonApiResponse, s3 } = serverUtilsRegistry;

const bodySchema = z.object({
	name: z.string().min(1).max(255),
	contentType: z.enum(GALLERY_ACCEPTED_MIME_TYPES),
	size: z
		.number()
		.int()
		.positive()
		.max(GALLERY_MAX_FILE_SIZE_BYTES, "File is too large"),
});

interface UploadUrlResponseData {
	uploadUrl: string;
	key: string;
	url: string;
}

export const POST = createApi<typeof bodySchema, undefined, true>({
	requireAuth: true,
	bodySchema,
	execute: async ({ body, user }) => {
		const internalUser = await getUserByClerkId(user!.id);
		if (!internalUser) {
			throw new ApiError("User not found", 404);
		}

		const extension = extensionFromFilename(body!.name);
		const key = s3.buildKey({ userId: internalUser.id, extension });
		const uploadUrl = await s3.getUploadUrl({
			key,
			contentType: body!.contentType,
		});

		return sendJsonApiResponse<UploadUrlResponseData>({
			code: 200,
			success: true,
			data: {
				uploadUrl,
				key,
				url: s3.getPublicUrl(key),
			},
		});
	},
});
