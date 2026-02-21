import { ErrorMapper } from "./error-mapper";

export const clientUtils = {
	errorMapper: new ErrorMapper(),
};

Object.freeze(clientUtils);
