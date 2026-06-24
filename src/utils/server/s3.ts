import { serverEnv } from "@/config/server-env";
import { GALLERY_UPLOAD_URL_EXPIRY_SECONDS } from "@/config/gallery-constants";
import {
	buildObjectKey,
	buildPublicUrl,
	createPresignedUploadUrl,
	createS3Client,
	deleteObject,
	type S3Config,
} from "@/lib/s3";
import type { S3Client } from "@aws-sdk/client-s3";

/**
 * Server-side S3 gateway (mirrors the {@link Clerk} util). Wraps the
 * runtime-agnostic helpers in `@/lib/s3` with validated `serverEnv` config so
 * route handlers can presign uploads, derive object keys/URLs, and delete files.
 */
export class S3 {
	private readonly config: S3Config = {
		bucket: serverEnv.AWS_BUCKET_NAME,
		region: serverEnv.AWS_BUCKET_REGION,
		accessKeyId: serverEnv.AWS_KEY_ID,
		secretAccessKey: serverEnv.AWS_KEY_SECRET,
	};

	private readonly client: S3Client = createS3Client(this.config);

	/** Build a `<user_id>/<random_id>-<cuid>.<ext>` storage key. */
	buildKey(args: { userId: string; extension: string }): string {
		return buildObjectKey(args);
	}

	/** Permanent public URL for a stored object (public-read bucket). */
	getPublicUrl(key: string): string {
		return buildPublicUrl({
			bucket: this.config.bucket,
			region: this.config.region,
			key,
		});
	}

	/** Presigned PUT URL for direct browser → S3 upload. */
	async getUploadUrl(args: {
		key: string;
		contentType: string;
	}): Promise<string> {
		return createPresignedUploadUrl(this.client, {
			bucket: this.config.bucket,
			key: args.key,
			contentType: args.contentType,
			expiresIn: GALLERY_UPLOAD_URL_EXPIRY_SECONDS,
		});
	}

	/** Delete a stored object by key. */
	async deleteObject(key: string): Promise<void> {
		await deleteObject(this.client, {
			bucket: this.config.bucket,
			key,
		});
	}
}
