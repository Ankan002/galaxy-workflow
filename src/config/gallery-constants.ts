/**
 * Gallery / file-storage constants shared by client and server. Kept free of
 * runtime imports so it can be used in the browser, Next server, and Trigger.dev
 * tasks alike.
 */

import type { gallery_item_type } from "@/db/prisma/enums";

/** Number of gallery items fetched per cursor page. */
export const GALLERY_PAGE_SIZE = 24;

/** Hard cap on a single uploaded file (100 MB). */
export const GALLERY_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/** Presigned upload URL lifetime in seconds (5 minutes). */
export const GALLERY_UPLOAD_URL_EXPIRY_SECONDS = 5 * 60;

/** All MIME types accepted by the gallery uploader. */
export const GALLERY_ACCEPTED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/svg+xml",
	"video/mp4",
	"video/webm",
	"video/quicktime",
	"video/x-m4v",
	"application/pdf",
	"text/plain",
] as const;

/** `accept` attribute value for native file inputs. */
export const GALLERY_ACCEPT_ATTRIBUTE = GALLERY_ACCEPTED_MIME_TYPES.join(",");

/** Gallery item type filters exposed in the UI (plus "all"). */
export const GALLERY_TYPE_FILTERS = [
	"all",
	"image",
	"video",
	"document",
	"others",
] as const;

export type GalleryTypeFilter = (typeof GALLERY_TYPE_FILTERS)[number];

/**
 * Resolve the {@link gallery_item_type} bucket for a MIME type. Images and
 * videos map by prefix; pdf/plain text are documents; everything else is others.
 */
export const resolveGalleryItemType = (
	mimeType: string,
): gallery_item_type => {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType === "application/pdf" || mimeType.startsWith("text/"))
		return "document";
	return "others";
};
