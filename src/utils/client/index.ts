import { ErrorMapper } from "./error-mapper";
import { QueryClient } from "./query-client";

export const clientUtils = {
	errorMapper: new ErrorMapper(),
	queryClient: new QueryClient(),
};

Object.freeze(clientUtils);
