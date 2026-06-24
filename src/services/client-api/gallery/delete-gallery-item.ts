import { API_ROUTES } from "@/config/client-constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const deleteGalleryItem = async (id: string): Promise<void> => {
	const response = await fetch(API_ROUTES.GALLERY.DELETE.dynamicPath(id), {
		method: API_ROUTES.GALLERY.DELETE.method,
		headers: { "Content-Type": "application/json" },
	});

	if (!response.ok) {
		throw new Error(`Failed to delete file: ${response.statusText}`);
	}
};

export const useDeleteGalleryItem = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteGalleryItem,
		mutationKey: [API_ROUTES.GALLERY.DELETE.key],
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ROUTES.GALLERY.LIST.key],
			});
		},
	});
};
