"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as tus from "tus-js-client";
import { API_ROUTES } from "@/config/client-constants";
import { JsonApiResponse } from "@/types/api";

interface PrepareResponseData {
	assembly_id: string;
	assembly_ssl_url: string;
	tus_url: string;
}

interface CompleteResponseData {
	previewUrl: string;
}

async function prepareUpload(
	workflowId: string,
	nodeId: string,
	type: "image" | "video",
): Promise<PrepareResponseData> {
	const res = await fetch(
		API_ROUTES.WORKFLOW_NODE.UPLOAD_PREPARE.dynamicPath(workflowId, nodeId),
		{
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type }),
		},
	);
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(
			(err?.error as string) || `Prepare failed: ${res.status} ${res.statusText}`,
		);
	}
	const data = (await res.json()) as JsonApiResponse<PrepareResponseData>;
	if (!data.success || !data.data) {
		throw new Error((data as { error?: string }).error || "Prepare failed");
	}
	return data.data;
}

async function completeUpload(
	workflowId: string,
	nodeId: string,
	assemblySslUrl: string,
): Promise<string> {
	const res = await fetch(
		API_ROUTES.WORKFLOW_NODE.UPLOAD_COMPLETE.dynamicPath(workflowId, nodeId),
		{
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ assembly_ssl_url: assemblySslUrl }),
		},
	);
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(
			(err?.error as string) || `Complete failed: ${res.status} ${res.statusText}`,
		);
	}
	const data = (await res.json()) as JsonApiResponse<CompleteResponseData>;
	if (!data.success || !data.data?.previewUrl) {
		throw new Error((data as { error?: string }).error || "Complete failed");
	}
	return data.data.previewUrl;
}

export function useTransloaditUpload(options: {
	workflowId: string;
	nodeId: string;
	type: "image" | "video";
	onSuccess?: (url: string) => void;
	onError?: (error: Error) => void;
}) {
	const { workflowId, nodeId, type, onSuccess, onError } = options;
	const queryClient = useQueryClient();
	const [isUploading, setIsUploading] = useState(false);
	const [progressPercent, setProgressPercent] = useState(0);
	const [error, setError] = useState<Error | null>(null);

	const uploadFile = useCallback(
		async (file: File) => {
			setError(null);
			setIsUploading(true);
			setProgressPercent(0);
			try {
				const { assembly_ssl_url, tus_url } = await prepareUpload(
					workflowId,
					nodeId,
					type,
				);
				await new Promise<void>((resolve, reject) => {
					const upload = new tus.Upload(file, {
						endpoint: tus_url,
						metadata: {
							assembly_url: assembly_ssl_url,
							fieldname: "file",
							filename: file.name,
						},
						onProgress: (bytesUploaded, bytesTotal) => {
							if (bytesTotal > 0) {
								setProgressPercent(
									Math.round((bytesUploaded / bytesTotal) * 100),
								);
							}
						},
						onSuccess: () => resolve(),
						onError: (err) => reject(err ?? new Error("Upload failed")),
					});
					upload.start();
				});
				const url = await completeUpload(workflowId, nodeId, assembly_ssl_url);
				queryClient.invalidateQueries({
					queryKey: [API_ROUTES.WORKFLOW_NODES.LIST.key, workflowId],
				});
				onSuccess?.(url);
			} catch (e) {
				const err = e instanceof Error ? e : new Error(String(e));
				setError(err);
				onError?.(err);
			} finally {
				setIsUploading(false);
				setProgressPercent(0);
			}
		},
		[workflowId, nodeId, type, queryClient, onSuccess, onError],
	);

	return { uploadFile, isUploading, progressPercent, error };
}
