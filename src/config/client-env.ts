import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const clientEnv = createEnv({
	client: {
		NEXT_PUBLIC_HOST: z.string({
			error: "NEXT_PUBLIC_HOST is required",
		}),
	},
	runtimeEnv: {
		NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST,
	},
});
