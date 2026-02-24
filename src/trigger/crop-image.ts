import { task, retry } from "@trigger.dev/sdk";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Transloadit } from "transloadit";

export interface CropImagePayload {
	/** URL of the source image (jpg, png, webp, gif, etc.). */
	picture_url: string;
	/** X offset as percentage of image width (0–100). Default 0. */
	x_percent?: number;
	/** Y offset as percentage of image height (0–100). Default 0. */
	y_percent?: number;
	/** Width of crop region as percentage of image width (0–100). Default 100. */
	width_percent?: number;
	/** Height of crop region as percentage of image height (0–100). Default 100. */
	height_percent?: number;
}

export interface CropImageOutput {
	uploaded_url: string;
}

const clamp = (v: number, min: number, max: number) =>
	Math.min(max, Math.max(min, v));

const ffprobePath = () => process.env["FFPROBE_PATH"] ?? "ffprobe";
const ffmpegPath = () => process.env["FFMPEG_PATH"] ?? "ffmpeg";

const FFPROBE_FFMPEG_MESSAGE =
	"FFPROBE_PATH and FFMPEG_PATH must be set when ffprobe/ffmpeg are not on PATH. " +
	"In Trigger cloud, add the ffmpeg() extension to trigger.config.ts build.extensions. " +
	"For local dev, set FFPROBE_PATH and FFMPEG_PATH in .env to your binary paths (e.g. /usr/bin/ffprobe).";

const SPAWN_TIMEOUT_MS = 60_000;

function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	label: string,
	kill?: () => void,
): Promise<T> {
	let t: ReturnType<typeof setTimeout>;
	const timeoutPromise = new Promise<never>((_, reject) => {
		t = setTimeout(() => {
			kill?.();
			reject(new Error(`${label} timed out after ${ms}ms`));
		}, ms);
	});
	return Promise.race([promise, timeoutPromise]).finally(() =>
		clearTimeout(t!),
	);
}

async function getImageDimensions(
	inputPath: string,
): Promise<{ width: number; height: number }> {
	const bin = ffprobePath();
	const proc = spawn(
		bin,
		[
			"-v",
			"error",
			"-show_entries",
			"stream=width,height",
			"-of",
			"json",
			"-i",
			inputPath,
		],
		{
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	let stdout = "";
	let stderr = "";
	proc.stdout?.on("data", (d) => (stdout += d.toString()));
	proc.stderr?.on("data", (d) => (stderr += d.toString()));

	const exitPromise = new Promise<void>((resolve, reject) => {
		proc.on("error", (err) => {
			const msg =
				(err as NodeJS.ErrnoException)?.code === "ENOENT"
					? `ffprobe not found: ${bin}. ${FFPROBE_FFMPEG_MESSAGE}`
					: (err as Error).message;
			reject(new Error(msg));
		});
		proc.on("close", (code) => {
			if (code === 0) resolve();
			else reject(new Error(stderr || `ffprobe exited ${code}`));
		});
	});

	await withTimeout(exitPromise, SPAWN_TIMEOUT_MS, "ffprobe", () =>
		proc.kill("SIGKILL"),
	);

	const json = JSON.parse(stdout) as {
		streams?: Array<{ width?: number; height?: number }>;
	};
	const stream = json.streams?.find(
		(s) =>
			s.width != null && s.height != null && s.width > 0 && s.height > 0,
	);
	const width = stream?.width ?? 0;
	const height = stream?.height ?? 0;
	if (!width || !height) {
		throw new Error(`Could not get image dimensions: ${stdout}`);
	}
	return { width, height };
}

async function runFfmpegCrop(
	inputPath: string,
	outputPath: string,
	cropFilter: string,
): Promise<void> {
	const bin = ffmpegPath();
	const proc = spawn(
		bin,
		[
			"-y",
			"-i",
			inputPath,
			"-vf",
			cropFilter,
			"-frames:v",
			"1",
			outputPath,
		],
		{
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	let stderr = "";
	proc.stderr?.on("data", (d) => (stderr += d.toString()));

	const exitPromise = new Promise<void>((resolve, reject) => {
		proc.on("error", (err) => {
			const msg =
				(err as NodeJS.ErrnoException)?.code === "ENOENT"
					? `ffmpeg not found: ${bin}. ${FFPROBE_FFMPEG_MESSAGE}`
					: (err as Error).message;
			reject(new Error(msg));
		});
		proc.on("close", (code) => {
			if (code === 0) resolve();
			else reject(new Error(stderr || `ffmpeg exited ${code}`));
		});
	});

	await withTimeout(exitPromise, SPAWN_TIMEOUT_MS, "ffmpeg", () =>
		proc.kill("SIGKILL"),
	);
}

export const cropImage = task({
	id: "crop-image",
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 1000,
		maxTimeoutInMs: 30_000,
		randomize: true,
	},
	run: async (payload: CropImagePayload): Promise<CropImageOutput> => {
		const {
			picture_url,
			x_percent = 0,
			y_percent = 0,
			width_percent = 100,
			height_percent = 100,
		} = payload;

		if (!picture_url || typeof picture_url !== "string") {
			throw new Error("payload.picture_url is required");
		}

		const x = clamp(Number(x_percent), 0, 100);
		const y = clamp(Number(y_percent), 0, 100);
		const w = clamp(Number(width_percent), 0, 100);
		const h = clamp(Number(height_percent), 0, 100);

		const tmpDir = os.tmpdir();
		const ts = Date.now();

		const response = await retry.onThrow(
			async () => {
				const res = await fetch(picture_url);
				if (!res.ok)
					throw new Error(`HTTP ${res.status}: ${res.statusText}`);
				return res;
			},
			{ maxAttempts: 3 },
		);

		const contentType = response.headers.get("content-type") ?? "";
		const ext = contentType.includes("png")
			? "png"
			: contentType.includes("webp")
				? "webp"
				: contentType.includes("gif")
					? "gif"
					: "jpg";
		const inputPath = path.join(tmpDir, `crop_input_${ts}.${ext}`);
		const outputPath = path.join(tmpDir, `crop_output_${ts}.png`);

		try {
			const blob = await response.blob();
			const buffer = Buffer.from(await blob.arrayBuffer());
			await fs.writeFile(inputPath, buffer);

			const { width, height } = await getImageDimensions(inputPath);
			const xPx = Math.floor((x / 100) * width);
			const yPx = Math.floor((y / 100) * height);
			const wPx = Math.floor((w / 100) * width);
			const hPx = Math.floor((h / 100) * height);

			if (wPx < 1 || hPx < 1) {
				throw new Error("Crop region would be zero size");
			}

			const cropFilter = `crop=${wPx}:${hPx}:${xPx}:${yPx}`;
			await runFfmpegCrop(inputPath, outputPath, cropFilter);

			const authKey = process.env["TRANSLOADIT_PUBLIC_KEY"];
			const authSecret = process.env["TRANSLOADIT_SECRET_KEY"];
			const templateId = process.env["TRANSLOADIT_IMAGE_TEMPLATE_ID"];
			if (!authKey || !authSecret || !templateId) {
				throw new Error(
					"TRANSLOADIT_PUBLIC_KEY, TRANSLOADIT_SECRET_KEY and TRANSLOADIT_IMAGE_TEMPLATE_ID must be set to upload the result to Transloadit.",
				);
			}

			const tus = new Transloadit({
				authKey,
				authSecret,
			});
			const status = await tus.createAssembly({
				files: { file: outputPath },
				params: { template_id: templateId },
				waitForCompletion: true,
			});

			const isPublicUrl = (s: string) =>
				typeof s === "string" &&
				(s.startsWith("https://") || s.startsWith("http://"));

			// Prefer URL from template result steps; fall back to upload's URL (the file we sent = cropped image)
			let uploaded_url: string | null = null;
			const resultsMap = status.results ?? {};
			for (const stepResults of Object.values(resultsMap)) {
				if (!Array.isArray(stepResults)) continue;
				for (const item of stepResults) {
					const url = item?.ssl_url ?? item?.url;
					if (url && isPublicUrl(url)) {
						uploaded_url = url;
						break;
					}
				}
				if (uploaded_url) break;
			}
			if (!uploaded_url) {
				const uploads =
					(
						status as {
							uploads?: Array<{ ssl_url?: string; url?: string }>;
						}
					).uploads ?? [];
				const firstUpload = uploads[0];
				const uploadUrl = firstUpload?.ssl_url ?? firstUpload?.url;
				if (uploadUrl && isPublicUrl(uploadUrl)) {
					uploaded_url = uploadUrl;
				}
			}
			if (!uploaded_url) {
				throw new Error(
					`Transloadit assembly did not return a public URL. results: ${JSON.stringify(resultsMap)}, uploads: ${JSON.stringify((status as { uploads?: unknown }).uploads)}`,
				);
			}

			return { uploaded_url };
		} finally {
			await fs.unlink(inputPath).catch(() => {});
			await fs.unlink(outputPath).catch(() => {});
		}
	},
	onComplete: async (params) => {
		console.log({
			result: params.result,
		});
	},
});
