import { serverEnv } from "@/config/server-env";
import { createApi, sendJsonApiResponse } from "@/utils/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

export const POST = createApi({
	execute: async ({ req }) => {
		const event = await verifyWebhook(req, {
			signingSecret: serverEnv.CLERK_WEBHOOK_SIGNING_SECRET,
		});

		const { type, data } = event;

		console.log({
			type,
			data,
		});

		return sendJsonApiResponse({
			success: true,
			code: 200,
			message: "Webhook received",
		});
	},
});
