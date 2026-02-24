import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
	server: {
		DATABASE_URL: z.string({
			error: "DATABASE_URL is required",
		}),
		DIRECT_URL: z.string({
			error: "DIRECT_URL is required",
		}),
		ENV: z.string({
			error: "ENV is required",
		}),
		HOST: z.string({
			error: "HOST is required",
		}),
		CLERK_SECRET_KEY: z.string({
			error: "CLERK_SECRET_KEY is required",
		}),
		CLERK_WEBHOOK_SIGNING_SECRET: z.string({
			error: "CLERK_WEBHOOK_SIGNING_SECRET is required",
		}),
		TRIGGER_SECRET_KEY: z.string({
			error: "TRIGGER_SECRET_KEY is required",
		}),
		TRIGGER_PROJECT_REF: z.string({
			error: "TRIGGER_PROJECT_REF is required",
		}),
		TRANSLOADIT_PUBLIC_KEY: z.string({
			error: "TRANSLOADIT_PUBLIC_KEY is required",
		}),
		TRANSLOADIT_SECRET_KEY: z.string({
			error: "TRANSLOADIT_SECRET_KEY is required",
		}),
		GEMINI_API_KEY: z.string({
			error: "GEMINI_API_KEY is required",
		}),
		TRANSLOADIT_IMAGE_TEMPLATE_ID: z.string({
			error: "TRANSLOADIT_IMAGE_TEMPLATE_ID is required",
		}),
		TRANSLOADIT_VIDEO_TEMPLATE_ID: z.string({
			error: "TRANSLOADIT_VIDEO_TEMPLATE_ID is required",
		}),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		DIRECT_URL: process.env.DIRECT_URL,
		ENV: process.env.ENV,
		HOST: process.env.HOST,
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
		CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
		TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
		TRIGGER_PROJECT_REF: process.env.TRIGGER_PROJECT_REF,
		TRANSLOADIT_PUBLIC_KEY: process.env.TRANSLOADIT_PUBLIC_KEY,
		TRANSLOADIT_SECRET_KEY: process.env.TRANSLOADIT_SECRET_KEY,
		GEMINI_API_KEY: process.env.GEMINI_API_KEY,
		TRANSLOADIT_IMAGE_TEMPLATE_ID:
			process.env.TRANSLOADIT_IMAGE_TEMPLATE_ID,
		TRANSLOADIT_VIDEO_TEMPLATE_ID:
			process.env.TRANSLOADIT_VIDEO_TEMPLATE_ID,
	},
});
