import { API_ROUTES } from "@/config/client-constants";
import type { gallery_item, gallery_item_type } from "@/db/prisma/browser";
import { JsonApiResponse } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface GalleryPage {
	items: gallery_item[];
	nextCursor: string | null;
}

interface FetchArgs {
	query?: string;
	type?: gallery_item_type;
	cursor?: string;
}

const fetchGalleryPage = async (args: FetchArgs): Promise<GalleryPage> => {
	const params = new URLSearchParams();
	if (args.query) params.set("query", args.query);
	if (args.type) params.set("type", args.type);
	if (args.cursor) params.set("cursor", args.cursor);

	const response = await fetch(
		`${API_ROUTES.GALLERY.LIST.path}?${params.toString()}`,
		{
			method: API_ROUTES.GALLERY.LIST.method,
			headers: { "Content-Type": "application/json" },
		},
	);

	if (!response.ok) {
		throw new Error(`Failed to load gallery: ${response.statusText}`);
	}

	const responseData =
		(await response.json()) as JsonApiResponse<GalleryPage>;

	if (!responseData.success || !responseData.data) {
		throw new Error(
			`Failed to load gallery: ${(responseData as { error?: string }).error ?? "unknown error"}`,
		);
	}

	return responseData.data;
};

interface HookArgs {
	query?: string;
	type?: gallery_item_type;
}

export const useGetGalleryItems = (args: HookArgs) => {
	const { isSignedIn } = useAuth();

	return useInfiniteQuery({
		queryKey: [API_ROUTES.GALLERY.LIST.key, args.query, args.type],
		queryFn: ({ pageParam }) =>
			fetchGalleryPage({
				query: args.query,
				type: args.type,
				cursor: pageParam as string | undefined,
			}),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		enabled: isSignedIn,
	});
};
