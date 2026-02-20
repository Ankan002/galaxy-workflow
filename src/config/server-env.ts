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
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		DIRECT_URL: process.env.DIRECT_URL,
		ENV: process.env.ENV,
		HOST: process.env.HOST,
	},
});
