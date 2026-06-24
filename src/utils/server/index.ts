import { Clerk } from "./clerk";
import { S3 } from "./s3";
import { logger } from "./logger";
import { sendJsonApiResponse } from "./api";
import { createApi } from "./api-factory";
import { GoogleGemini } from "./google-gemini";

export const serverUtilsRegistry = Object.freeze({
	logger,
	sendJsonApiResponse,
	createApi,
	clerk: new Clerk(),
	s3: new S3(),
	googleGemini: new GoogleGemini(),
});
