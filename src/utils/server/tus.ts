import { serverEnv } from "@/config/server-env";
import { Transloadit } from "transloadit";

const isPublicUrl = (s: string) =>
	typeof s === "string" && (s.startsWith("https://") || s.startsWith("http://"));

/** Extract the first public result URL from a Transloadit assembly status JSON. */
export function getPublicUrlFromAssemblyStatus(status: {
	results?: Record<string, Array<{ ssl_url?: string; url?: string }>>;
	uploads?: Array<{ ssl_url?: string; url?: string }>;
}): string | null {
	let uploadedUrl: string | null = null;
	const resultsMap = status.results ?? {};
	for (const stepResults of Object.values(resultsMap)) {
		if (!Array.isArray(stepResults)) continue;
		for (const item of stepResults) {
			const url = item?.ssl_url ?? item?.url;
			if (url && isPublicUrl(url)) {
				uploadedUrl = url;
				break;
			}
		}
		if (uploadedUrl) break;
	}
	if (!uploadedUrl && Array.isArray(status.uploads) && status.uploads[0]) {
		const u = status.uploads[0];
		const url = u?.ssl_url ?? u?.url;
		if (url && isPublicUrl(url)) uploadedUrl = url;
	}
	return uploadedUrl;
}

export class TUS {
	client: Transloadit;

	constructor() {
		this.client = new Transloadit({
			authKey: serverEnv.TRANSLOADIT_PUBLIC_KEY,
			authSecret: serverEnv.TRANSLOADIT_SECRET_KEY,
		});
	}

	/**
	 * Create an assembly for client-side TUS upload. Returns assembly_ssl_url and tus_url
	 * so the client can upload the file. When processing completes, Transloadit POSTs to notify_url.
	 */
	async createAssemblyForClientUpload(options: {
		templateId: string;
		notifyUrl: string;
		fields?: Record<string, string>;
	}): Promise<{
		assembly_id: string;
		assembly_ssl_url: string;
		tus_url: string;
	}> {
		const params: Record<string, unknown> = {
			template_id: options.templateId,
			notify_url: options.notifyUrl,
			...(options.fields && Object.keys(options.fields).length > 0
				? { fields: options.fields }
				: {}),
		};
		const result = await this.client.createAssembly({
			files: {},
			params,
			expectedUploads: 1,
			waitForCompletion: false,
		});
		const out = result as {
			assembly_id?: string;
			assembly_ssl_url?: string;
			tus_url?: string;
		};
		if (!out.assembly_ssl_url || !out.tus_url) {
			throw new Error(
				`Transloadit did not return assembly_ssl_url or tus_url: ${JSON.stringify(out)}`,
			);
		}
		return {
			assembly_id: out.assembly_id ?? "",
			assembly_ssl_url: out.assembly_ssl_url,
			tus_url: out.tus_url,
		};
	}

	/**
	 * Fetch assembly status from assembly_ssl_url and return the first public result URL.
	 * Polls until assembly is completed (Transloadit may still be processing when TUS upload finishes).
	 */
	async fetchAssemblyAndGetPublicUrl(assemblySslUrl: string): Promise<string> {
		const maxAttempts = 30;
		const delayMs = 2000;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const res = await fetch(assemblySslUrl, { method: "GET" });
			if (!res.ok) {
				throw new Error(
					`Failed to fetch assembly status: ${res.status} ${res.statusText}`,
				);
			}
			const status = (await res.json()) as Parameters<
				typeof getPublicUrlFromAssemblyStatus
			>[0] & { ok?: string };
			const url = getPublicUrlFromAssemblyStatus(status);
			if (url) return url;
			if (status.ok === "ASSEMBLY_COMPLETED") {
				throw new Error("No public URL in assembly result");
			}
			if (attempt < maxAttempts - 1) {
				await new Promise((r) => setTimeout(r, delayMs));
			}
		}
		throw new Error("Assembly did not complete in time");
	}
}
