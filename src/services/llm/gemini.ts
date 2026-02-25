import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

export interface GenerateContentWithGeminiArgs {
	apiKey: string;
	prompt: string;
	image_urls?: string[];
	systemPrompt?: string;
	model?: string;
	fetchImageAsBase64?: (
		url: string,
	) => Promise<{ mimeType: string; data: string }>;
}

export interface GenerateContentWithGeminiResult {
	text: string;
}

export async function generateContentWithGemini(
	args: GenerateContentWithGeminiArgs,
): Promise<GenerateContentWithGeminiResult> {
	const {
		apiKey,
		prompt,
		image_urls,
		systemPrompt,
		model,
		fetchImageAsBase64,
	} = args;

	const client = new GoogleGenerativeAI(apiKey);
	const modelName = model?.trim() || "gemini-2.5-flash";
	const genModel = client.getGenerativeModel({
		model: modelName,
		...(systemPrompt && { systemInstruction: systemPrompt }),
	});

	const contentParts: Part[] = [];

	if (image_urls?.length && fetchImageAsBase64) {
		for (const url of image_urls) {
			const { mimeType, data } = await fetchImageAsBase64(url);
			contentParts.push({ inlineData: { mimeType, data } });
		}
	}

	contentParts.push({ text: prompt });

	const result = await genModel.generateContent({
		contents: [{ role: "user", parts: contentParts }],
	});

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
}
