/**
 * Runtime-agnostic S3 helpers. Intentionally free of `serverEnv` / `@t3-oss`
 * so this module can run in the Next.js server **and** in Trigger.dev tasks
 * (which read credentials straight from `process.env`). Callers supply the
 * bucket config explicitly.
 */

import { randomBytes, randomUUID } from "node:crypto";
import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3Config {
	bucket: string;
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
}

/**
 * Build an S3 client from explicit credentials.
 *
 * `requestChecksumCalculation: "WHEN_REQUIRED"` is important: since AWS SDK v3.729
 * the client otherwise injects a default CRC32 checksum (computed over an empty
 * body) into presigned PUT URLs, which makes browser uploads of the real file
 * fail with a checksum/signature mismatch. Disabling it keeps presigned PUTs
 * simple (host-only signed headers) so a plain `fetch`/`XHR` PUT succeeds.
 */
export const createS3Client = (config: S3Config): S3Client =>
	new S3Client({
		region: config.region,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		requestChecksumCalculation: "WHEN_REQUIRED",
		responseChecksumValidation: "WHEN_REQUIRED",
	});

/**
 * Build a storage key following the convention
 * `<user_id>/<random_id>-<cuid>.<extension>`.
 */
export const buildObjectKey = (args: {
	userId: string;
	extension: string;
}): string => {
	const randomId = randomBytes(8).toString("hex");
	const cuid = randomUUID().replace(/-/g, "");
	const ext = args.extension.replace(/^\.+/, "").toLowerCase() || "bin";
	return `${args.userId}/${randomId}-${cuid}.${ext}`;
};

/** Permanent virtual-hosted-style public URL for an object (public-read bucket). */
export const buildPublicUrl = (args: {
	bucket: string;
	region: string;
	key: string;
}): string =>
	`https://${args.bucket}.s3.${args.region}.amazonaws.com/${args.key}`;

/** Generate a presigned PUT URL the browser can upload to directly. */
export const createPresignedUploadUrl = async (
	client: S3Client,
	args: {
		bucket: string;
		key: string;
		contentType: string;
		expiresIn: number;
	},
): Promise<string> => {
	const command = new PutObjectCommand({
		Bucket: args.bucket,
		Key: args.key,
		ContentType: args.contentType,
	});
	return getSignedUrl(client, command, { expiresIn: args.expiresIn });
};

/** Upload a buffer to S3 from the server/worker (used by Trigger.dev tasks). */
export const putObject = async (
	client: S3Client,
	args: {
		bucket: string;
		key: string;
		body: Buffer | Uint8Array;
		contentType: string;
	},
): Promise<void> => {
	await client.send(
		new PutObjectCommand({
			Bucket: args.bucket,
			Key: args.key,
			Body: args.body,
			ContentType: args.contentType,
		}),
	);
};

/** Delete an object by key. Best-effort; throws on transport errors. */
export const deleteObject = async (
	client: S3Client,
	args: { bucket: string; key: string },
): Promise<void> => {
	await client.send(
		new DeleteObjectCommand({ Bucket: args.bucket, Key: args.key }),
	);
};

/** Extract a lowercase extension (no dot) from a filename, defaulting to "bin". */
export const extensionFromFilename = (filename: string): string => {
	const match = /\.([a-zA-Z0-9]+)$/.exec(filename.trim());
	return match ? match[1].toLowerCase() : "bin";
};
