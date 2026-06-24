import { API_ROUTES } from "@/config/client-constants";
import type { gallery_item } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UploadUrlResponseData {
	uploadUrl: string;
	key: string;
	url: string;
}

interface ConfirmResponseData {
	item: gallery_item;
}

/** PUT a file straight to S3 via a presigned URL, reporting progress. */
const putToS3 = (
	uploadUrl: string,
	file: File,
	onProgress?: (percent: number) => void,
): Promise<void> =>
	new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", uploadUrl, true);
		xhr.setRequestHeader("Content-Type", file.type);
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable && onProgress) {
				onProgress(Math.round((event.loaded / event.total) * 100));
			}
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) resolve();
			else reject(new Error(`Upload failed: ${xhr.status}`));
		};
		xhr.onerror = () => reject(new Error("Upload failed"));
		xhr.send(file);
	});

export interface UploadGalleryFileArgs {
	file: File;
	onProgress?: (percent: number) => void;
}

/**
 * Three-step gallery upload: presign → direct S3 PUT → confirm (DB row).
 * Returns the created gallery item.
 */
export const uploadGalleryFile = async (
	args: UploadGalleryFileArgs,
): Promise<gallery_item> => {
	const { file, onProgress } = args;

	const presignRes = await fetch(API_ROUTES.GALLERY.UPLOAD_URL.path, {
		method: API_ROUTES.GALLERY.UPLOAD_URL.method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: file.name,
			contentType: file.type,
			size: file.size,
		}),
	});
	if (!presignRes.ok) {
		throw new Error(`Failed to prepare upload: ${presignRes.statusText}`);
	}
	const presign =
		(await presignRes.json()) as JsonApiResponse<UploadUrlResponseData>;
	if (!presign.success || !presign.data) {
		throw new Error(
			(presign as { error?: string }).error ?? "Failed to prepare upload",
		);
	}

	await putToS3(presign.data.uploadUrl, file, onProgress);

	const confirmRes = await fetch(API_ROUTES.GALLERY.CONFIRM.path, {
		method: API_ROUTES.GALLERY.CONFIRM.method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: file.name,
			key: presign.data.key,
			contentType: file.type,
			size: file.size,
		}),
	});
	if (!confirmRes.ok) {
		throw new Error(`Failed to save upload: ${confirmRes.statusText}`);
	}
	const confirm =
		(await confirmRes.json()) as JsonApiResponse<ConfirmResponseData>;
	if (!confirm.success || !confirm.data) {
		throw new Error(
			(confirm as { error?: string }).error ?? "Failed to save upload",
		);
	}

	return confirm.data.item;
};

export const useUploadGalleryFile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: uploadGalleryFile,
		mutationKey: [API_ROUTES.GALLERY.UPLOAD_URL.key],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.GALLERY.LIST.key],
			});
		},
	});
};
