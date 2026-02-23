import { ErrorMapper } from "./error-mapper";
import { NameGenerator } from "./name-generator";
import { QueryClient } from "./query-client";
import { UIEventsHandler } from "./ui-events-handler";

export const clientUtils = {
	errorMapper: new ErrorMapper(),
	queryClient: new QueryClient(),
	nameGenerator: new NameGenerator(),
	uiEventsHandler: new UIEventsHandler(),
};

Object.freeze(clientUtils);
