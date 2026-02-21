import { createApi, sendJsonApiResponse } from "@/utils/server";

export const GET = createApi({
	execute: async () => {
		return sendJsonApiResponse({
			success: true,
			code: 200,
			message: "Health API Works!",
		});
	},
});

export const validate = 0;
