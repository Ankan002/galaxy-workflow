import { NextRequest } from "next/server";
import { z } from "zod";

/** Inferred output type when T is a Zod schema; otherwise undefined */
export type InferBodyOrUndefined<T> = T extends z.ZodTypeAny
	? z.infer<T>
	: undefined;

/** Inferred output type when T is a Zod schema; otherwise undefined */
export type InferQueryOrUndefined<T> = T extends z.ZodTypeAny
	? z.infer<T>
	: undefined;

export type ApiHandler<
	TBody extends z.ZodTypeAny | undefined,
	TQuery extends z.ZodTypeAny | undefined,
	TRequireAuth extends boolean,
> = {
	bodySchema?: TBody;
	querySchema?: TQuery;
	requireAuth?: TRequireAuth;
	execute: (ctx: {
		req: NextRequest;
		body: InferBodyOrUndefined<TBody>;
		query: InferQueryOrUndefined<TQuery>;
		user: TRequireAuth extends true
			? {
					id: string;
				}
			: undefined;
		/** Route params from Next.js dynamic segments (e.g. [workflowId], [nodeId]) */
		params?: Record<string, string | undefined>;
	}) => Promise<Response>;
};
