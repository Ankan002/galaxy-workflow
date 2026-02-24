import { Clerk } from "./clerk";
import { TUS } from "./tus";
import { logger } from "./logger";
import { sendJsonApiResponse } from "./api";
import { createApi } from "./api-factory";

export const serverUtilsRegistry = Object.freeze({
	logger,
	sendJsonApiResponse,
	createApi,
	clerk: new Clerk(),
	tus: new TUS(),
});
