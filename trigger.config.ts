import { defineConfig } from "@trigger.dev/sdk";
import { ffmpeg } from "@trigger.dev/build/extensions/core";
import "dotenv/config";

export default defineConfig({
	// Your project ref from the Trigger.dev dashboard (e.g. proj_abc123)
	project: process.env["TRIGGER_PROJECT_REF"]!,

	runtime: "bun",

	dirs: ["./src/trigger"],

	retries: {
		enabledInDev: false,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},

	maxDuration: 3600,

	build: {
		extensions: [ffmpeg()],
	},
});
