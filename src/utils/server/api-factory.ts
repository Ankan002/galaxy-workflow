import { Prisma } from "@/db/prisma/client";
import { ApiHandler } from "@/types/api";
import type {
	InferBodyOrUndefined,
	InferQueryOrUndefined,
} from "@/types/api/api-handler";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { sendJsonApiResponse } from "./api";
import { ApiError } from "@/types/errors/api-error";
import { logger } from "./logger";
import {} from "@clerk/nextjs/server";

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
				const { userId, isAuthenticated } = await auth();

				if (!isAuthenticated) {
					throw new ApiError("Unauthorized", 401);
				}

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
			logger.error(`API Error: ${error}`);
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (
					(error as Prisma.PrismaClientKnownRequestError).code ===
						"P2002" ||
					(error as Prisma.PrismaClientKnownRequestError).code ===
						"P2014"
				) {
					return sendJsonApiResponse({
						success: false,
						error: "Some unique item collision occurred!!",
						code: 400,
					});
				}

				if (
					(error as Prisma.PrismaClientKnownRequestError).code ===
					"P2023"
				) {
					return sendJsonApiResponse({
						success: false,
						error: "Either no data found or some inconsistent column data type found.",
						code: 400,
					});
				}

				if (
					(error as Prisma.PrismaClientKnownRequestError).code ===
					"P2025"
				) {
					return sendJsonApiResponse({
						success: false,
						error: "Data not found!!",
						code: 404,
					});
				}
			}

			if (error instanceof z.ZodError) {
				return sendJsonApiResponse({
					success: false,
					error: error.issues[0].message,
					code: 400,
				});
			}

			if (error instanceof ApiError) {
				return sendJsonApiResponse({
					success: false,
					error: error.message,
					code: error.code,
				});
			}

			/* --------------------------- Unexpected Error ------------------------- */

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
