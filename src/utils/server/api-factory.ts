import { ApiHandler } from "@/types/api";
import type {
	InferBodyOrUndefined,
	InferQueryOrUndefined,
} from "@/types/api/api-handler";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export function createApi<
	TBody extends z.ZodTypeAny | undefined = undefined,
	TQuery extends z.ZodTypeAny | undefined = undefined,
	TRequireAuth extends boolean = false,
>(config: ApiHandler<TBody, TQuery, TRequireAuth>) {
	return async (req: NextRequest) => {
		try {
			let parsedBody = undefined as InferBodyOrUndefined<TBody>;
			let parsedQuery = undefined as InferQueryOrUndefined<TQuery>;
			let user = undefined as TRequireAuth extends true
				? { id: string }
				: undefined;

			if (config.requireAuth) {
				const { userId } = await auth();

				if (!userId) {
					return NextResponse.json(
						{ success: false, message: "Unauthorized" },
						{ status: 401 },
					);
				}

				user = { id: userId } as TRequireAuth extends true
					? { id: string }
					: undefined;
			}

			if (config.bodySchema) {
				const json = await req.json();
				parsedBody = config.bodySchema.parse(
					json,
				) as InferBodyOrUndefined<TBody>;
			}

			if (config.querySchema) {
				const url = new URL(req.url);
				const queryObject = Object.fromEntries(
					url.searchParams.entries(),
				);

				parsedQuery = config.querySchema.parse(
					queryObject,
				) as InferQueryOrUndefined<TQuery>;
			}

			/* --------------------------- Execute Handler -------------------------- */

			return await config.execute({
				req,
				body: parsedBody,
				query: parsedQuery,
				user,
			});
		} catch (error: unknown) {
			// TODO: Write the error handlers correctly
			/* --------------------------- Zod Validation --------------------------- */

			if (error instanceof z.ZodError) {
				return NextResponse.json(
					{
						success: false,
						message: "Validation failed",
						errors: error.flatten(),
					},
					{ status: 400 },
				);
			}

			/* --------------------------- Unexpected Error ------------------------- */

			console.error("API Error:", error);

			const message =
				error instanceof Error
					? error.message
					: "Internal Server Error";

			return NextResponse.json(
				{
					success: false,
					message:
						process.env.NODE_ENV === "development"
							? message
							: "Internal Server Error",
				},
				{ status: 500 },
			);
		}
	};
}
