import { task, logger, retry } from "@trigger.dev/sdk";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

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
	run: async (payload: RunLLMPayload): Promise<RunLLMOutput> => {
		const apiKey = process.env["GEMINI_API_KEY"];
		if (!apiKey) {
			throw new Error("GEMINI_API_KEY is not set");
		}

		const { prompt, image_urls, systemPrompt, model } = payload;
		if (!prompt || typeof prompt !== "string") {
			throw new Error("payload.prompt is required and must be a string");
		}

		const client = new GoogleGenerativeAI(apiKey);
		const modelName = model?.trim() || "gemini-2.5-flash";
		const genModel = client.getGenerativeModel({
			model: modelName,
			...(systemPrompt && {
				systemInstruction: systemPrompt,
			}),
		});

		const contentParts: Part[] = [];

		if (image_urls?.length) {
			logger.info("Fetching images for context", {
				count: image_urls.length,
				urls: image_urls.slice(0, 3),
			});
			for (const url of image_urls) {
				const { mimeType, data } = await fetchImageAsInlineData(url);
				contentParts.push({ inlineData: { mimeType, data } });
			}
		}

		contentParts.push({ text: prompt });

		const result = await logger.trace(
			"gemini-generateContent",
			async () => {
				return await genModel.generateContent({
					contents: [{ role: "user", parts: contentParts }],
				});
			},
		);

		const response = result.response;
		if (!response?.candidates?.length) {
			const text = response?.promptFeedback?.blockReason
				? `Blocked: ${response.promptFeedback.blockReason}`
				: "No text generated";
			throw new Error(text);
		}

		const candidate = response.candidates[0];
		const textPart = candidate.content?.parts?.find((p) => p.text != null);
		const text = textPart?.text?.trim() ?? "";

		return { text };
	},
	onComplete: async (params) => {
		if (params.result.ok) {
			const { text } = params.result.data;

			console.log(text);
		}
	},
});
