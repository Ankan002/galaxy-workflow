import { task, logger, retry } from "@trigger.dev/sdk";
import {
	stripExecutionMeta,
	notifyExecutionComplete,
	type ExecutionMeta,
} from "./execution-callback";
import { getValidLlmModel } from "@/lib/execution/llm-models";
import { generateContentWithGemini } from "@/services/llm/gemini";

export interface RunLLMPayload {
	prompt: string;
	image_urls?: string[];
	systemPrompt?: string;
	model?: string;
}

export interface RunLLMOutput {
	text: string;
}

async function fetchImageAsInlineData(
	url: string,
): Promise<{ mimeType: string; data: string }> {
	const response = await retry.onThrow(
		async () => {
			const res = await fetch(url);
			if (!res.ok)
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			return res;
		},
		{ maxAttempts: 3 },
	);
	const blob = await response.blob();
	const buffer = await blob.arrayBuffer();
	const base64 = Buffer.from(buffer).toString("base64");
	const mimeType = blob.type || "image/png";
	return { mimeType, data: base64 };
}

export const runLLM = task({
	id: "run-llm",
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 1000,
		maxTimeoutInMs: 30_000,
		randomize: true,
	},
	run: async (
		payload: RunLLMPayload & { _executionMeta?: ExecutionMeta },
	): Promise<RunLLMOutput> => {
		const { payload: rawPayload, meta } = stripExecutionMeta(payload);
		const cleanPayload = rawPayload as RunLLMPayload;

		const { prompt, image_urls, systemPrompt, model: modelFromPayload } = cleanPayload;
		const model = getValidLlmModel(modelFromPayload);
		if (!prompt || typeof prompt !== "string") {
			throw new Error("payload.prompt is required and must be a string");
		}

		const apiKey = process.env["GEMINI_API_KEY"];
		if (!apiKey) {
			throw new Error("GEMINI_API_KEY is not set");
		}

		if (image_urls?.length) {
			logger.info("Fetching images for context", {
				count: image_urls.length,
				urls: image_urls.slice(0, 3),
			});
		}

		try {
			const result = await logger.trace(
				"gemini-generateContent",
				async () => {
					return await generateContentWithGemini({
						apiKey,
						prompt,
						image_urls,
						systemPrompt,
						model, // always valid (gemini-2.5-flash | gemini-2.5-pro) from getValidLlmModel
						fetchImageAsBase64: fetchImageAsInlineData,
					});
				},
			);
			const output = { text: result.text };
			if (meta?.completionUrl) {
				await notifyExecutionComplete(meta, output, null);
			}
			return output;
		} catch (err) {
			if (meta?.completionUrl) {
				await notifyExecutionComplete(
					meta,
					null,
					err instanceof Error ? err.message : String(err),
				);
			}
			throw err;
		}
	},
});
