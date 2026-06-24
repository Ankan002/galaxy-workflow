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
		GEMINI_API_KEY: z.string({
			error: "GEMINI_API_KEY is required",
		}),
		AWS_BUCKET_NAME: z.string({
			error: "AWS_BUCKET_NAME is required",
		}),
		AWS_BUCKET_REGION: z.string({
			error: "AWS_BUCKET_REGION is required",
		}),
		AWS_KEY_ID: z.string({
			error: "AWS_KEY_ID is required",
		}),
		AWS_KEY_SECRET: z.string({
			error: "AWS_KEY_SECRET is required",
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
		GEMINI_API_KEY: process.env.GEMINI_API_KEY,
		AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
		AWS_BUCKET_REGION: process.env.AWS_BUCKET_REGION,
		AWS_KEY_ID: process.env.AWS_KEY_ID,
		AWS_KEY_SECRET: process.env.AWS_KEY_SECRET,
	},
});
