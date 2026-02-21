import { JsonApiResponse } from "@/types/api";
import { NextResponse } from "next/server";

export const sendJsonApiResponse = <D = void>(response: JsonApiResponse<D>) => {
	return NextResponse.json(response, {
		status: response.code,
	});
};
