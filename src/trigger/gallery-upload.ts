import { PrismaClient } from "@/db/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
	buildObjectKey,
	buildPublicUrl,
	createS3Client,
	putObject,
} from "@/lib/s3";
import { resolveGalleryItemType } from "@/config/gallery-constants";

interface UploadOutputArgs {
	/** Owning workflow id (from execution meta); used to resolve the gallery owner. */
	workflowId: string;
	buffer: Buffer;
	extension: string;
	contentType: string;
	/** Display name stored on the gallery item (e.g. "crop-1700000000.png"). */
	name: string;
}

/**
 * Persist a processing-node output (cropped image, extracted frame) to S3 and,
 * when the workflow has an owner, create a matching `gallery_item` so generated
 * assets show up in the user's gallery. Returns the public object URL.
 *
 * Runs inside Trigger.dev tasks, so it reads credentials from `process.env` and
 * manages its own Prisma client (per the trigger conventions).
 */
export const uploadOutputToGallery = async (
	args: UploadOutputArgs,
): Promise<string> => {
	const bucket = process.env["AWS_BUCKET_NAME"];
	const region = process.env["AWS_BUCKET_REGION"];
	const accessKeyId = process.env["AWS_KEY_ID"];
	const secretAccessKey = process.env["AWS_KEY_SECRET"];
	const connectionString = process.env["DATABASE_URL"];

	if (!bucket || !region || !accessKeyId || !secretAccessKey) {
		throw new Error(
			"AWS_BUCKET_NAME, AWS_BUCKET_REGION, AWS_KEY_ID and AWS_KEY_SECRET must be set to upload outputs to S3.",
		);
	}
	if (!connectionString) {
		throw new Error("DATABASE_URL is not set");
	}

	const prisma = new PrismaClient({
		adapter: new PrismaPg({ connectionString }),
	});

	try {
		// Resolve the gallery owner from the workflow. System-example workflows
		// have no owner — we still store the object, just under a shared prefix.
		const workflow = args.workflowId
			? await prisma.workflow_file.findUnique({
					where: { id: args.workflowId },
					select: { user_id: true },
				})
			: null;
		const ownerId = workflow?.user_id ?? null;

		const key = buildObjectKey({
			userId: ownerId ?? "system",
			extension: args.extension,
		});

		const client = createS3Client({
			bucket,
			region,
			accessKeyId,
			secretAccessKey,
		});
		await putObject(client, {
			bucket,
			key,
			body: args.buffer,
			contentType: args.contentType,
		});

		const url = buildPublicUrl({ bucket, region, key });

		if (ownerId) {
			await prisma.gallery_item.create({
				data: {
					user: { connect: { id: ownerId } },
					type: resolveGalleryItemType(args.contentType),
					name: args.name,
					key,
					url,
					extension: args.extension,
					mime_type: args.contentType,
					size: args.buffer.byteLength,
				},
			});
		}

		return url;
	} finally {
		await prisma.$disconnect();
	}
};
