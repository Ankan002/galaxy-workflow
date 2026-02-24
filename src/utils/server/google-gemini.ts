import { serverEnv } from "@/config/server-env";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";

export class GoogleGemini {
	client: GoogleGenerativeAI;
	model: GenerativeModel;

	constructor() {
		this.client = new GoogleGenerativeAI(serverEnv.GEMINI_API_KEY);
		this.model = this.client.getGenerativeModel({
			model: "gemini-2.5-flash",
		});
	}
}
