import { serverEnv } from "@/config/server-env";
import { deleteUser, upsertUser } from "@/db/actions/user.action";
import { createApi, sendJsonApiResponse } from "@/utils/server";
import { UserDeletedJSON } from "@clerk/backend";
import { UserJSON } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

const WebhookEventHandlers = {
	"user.created": async (data: UserJSON) => {
		await upsertUser({
			clerkId: data.id,
		});
	},
	"user.updated": async (data: UserJSON) => {
		await upsertUser({
			clerkId: data.id,
		});
	},
	"user.deleted": async (data: UserDeletedJSON) => {
		await deleteUser({
			clerkId: data.id,
		});
	},
};

export const POST = createApi({
	execute: async ({ req }) => {
		const event = await verifyWebhook(req, {
			signingSecret: serverEnv.CLERK_WEBHOOK_SIGNING_SECRET,
		});

		const { type, data } = event;

		// TODO: Refactor this to implement event triggers
		if (type === "user.created" || type === "user.updated") {
			await WebhookEventHandlers[type](data);
			console.log("User created or updated");
		} else if (type === "user.deleted") {
			await WebhookEventHandlers[type](data);
			console.log("User deleted");
		}

		return sendJsonApiResponse({
			success: true,
			code: 200,
			message: "Webhook received",
		});
	},
});
