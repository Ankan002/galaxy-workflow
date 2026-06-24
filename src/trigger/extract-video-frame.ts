import { task, retry } from "@trigger.dev/sdk";
import {
	stripExecutionMeta,
	handleExecutionComplete,
	type ExecutionMeta,
} from "./execution-callback";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { uploadOutputToGallery } from "./gallery-upload";

export interface ExtractVideoFramePayload {
	/** URL of the source video (mp4, mov, webm, m4v). */
	video_url: string;
	/** Time for the frame: seconds (e.g. 10) or percentage (e.g. "50%"). Default 0. */
	timestamp?: number | string;
}

export interface ExtractVideoFrameOutput {
	/** Extracted frame image URL (jpg/png) after upload to S3. */
	output: string;
}

const ffprobePath = () => process.env["FFPROBE_PATH"] ?? "ffprobe";
const ffmpegPath = () => process.env["FFMPEG_PATH"] ?? "ffmpeg";

const FFPROBE_FFMPEG_MESSAGE =
	"FFPROBE_PATH and FFMPEG_PATH must be set when ffprobe/ffmpeg are not on PATH. " +
	"In Trigger cloud, add the ffmpeg() extension to trigger.config.ts build.extensions. " +
	"For local dev, set FFPROBE_PATH and FFMPEG_PATH in .env to your binary paths.";

const SPAWN_TIMEOUT_MS = 120_000;

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

async function getVideoDuration(inputPath: string): Promise<number> {
	const bin = ffprobePath();
	const proc = spawn(
		bin,
		[
			"-v",
			"error",
			"-show_entries",
			"format=duration",
			"-of",
			"json",
			"-i",
			inputPath,
		],
		{ stdio: ["ignore", "pipe", "pipe"] },
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
	const json = JSON.parse(stdout) as { format?: { duration?: string } };
	const dur = Number(json.format?.duration);
	if (!Number.isFinite(dur) || dur < 0) {
		throw new Error(`Could not get video duration: ${stdout}`);
	}
	return dur;
}

async function extractFrameAt(
	inputPath: string,
	outputPath: string,
	seconds: number,
): Promise<void> {
	const bin = ffmpegPath();
	const proc = spawn(
		bin,
		[
			"-y",
			"-ss",
			String(Math.max(0, seconds)),
			"-i",
			inputPath,
			"-frames:v",
			"1",
			"-q:v",
			"2",
			outputPath,
		],
		{ stdio: ["ignore", "pipe", "pipe"] },
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

function parseTimestamp(
	value: number | string | undefined,
	durationSeconds: number,
): number {
	if (value === undefined || value === null) return 0;
	if (typeof value === "number" && Number.isFinite(value))
		return Math.max(0, value);
	const s = String(value).trim();
	if (s.endsWith("%")) {
		const pct = Number(s.slice(0, -1));
		if (!Number.isFinite(pct)) return 0;
		return Math.max(
			0,
			(durationSeconds * Math.min(100, Math.max(0, pct))) / 100,
		);
	}
	const n = Number(s);
	return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export const extractVideoFrame = task({
	id: "extract-video-frame",
	machine: "large-1x",
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 1000,
		maxTimeoutInMs: 30_000,
		randomize: true,
	},
	onSuccess: async ({ payload, output }) => {
		const { meta } = stripExecutionMeta(payload);
		if (meta) {
			await handleExecutionComplete(
				meta,
				output as unknown as Record<string, unknown>,
				null,
			);
		}
	},
	onFailure: async ({ payload, error }) => {
		const { meta } = stripExecutionMeta(payload);
		if (meta) {
			const errMsg = error instanceof Error ? error.message : String(error);
			await handleExecutionComplete(meta, null, errMsg);
		}
	},
	run: async (
		payload: ExtractVideoFramePayload & { _executionMeta?: ExecutionMeta },
	): Promise<ExtractVideoFrameOutput> => {
		const { payload: rawPayload, meta } = stripExecutionMeta(payload);
		const cleanPayload = rawPayload as ExtractVideoFramePayload;
		const { video_url, timestamp = 0 } = cleanPayload;

		if (!video_url || typeof video_url !== "string") {
			throw new Error("payload.video_url is required");
		}

		const tmpDir = os.tmpdir();
		const ts = Date.now();

		const response = await retry.onThrow(
			async () => {
				const res = await fetch(video_url);
				if (!res.ok)
					throw new Error(`HTTP ${res.status}: ${res.statusText}`);
				return res;
			},
			{ maxAttempts: 3 },
		);

		const contentType = response.headers.get("content-type") ?? "";
		const ext = contentType.includes("webm")
			? "webm"
			: contentType.includes("quicktime") || contentType.includes("mov")
				? "mov"
				: contentType.includes("m4v")
					? "m4v"
					: "mp4";
		const inputPath = path.join(tmpDir, `extract_frame_video_${ts}.${ext}`);
		const outputPath = path.join(tmpDir, `extract_frame_output_${ts}.jpg`);

		try {
			const blob = await response.blob();
			const buffer = Buffer.from(await blob.arrayBuffer());
			await fs.writeFile(inputPath, buffer);

			const duration = await getVideoDuration(inputPath);
			const seconds = parseTimestamp(
				timestamp as number | string | undefined,
				duration,
			);
			await extractFrameAt(inputPath, outputPath, seconds);

			const resultBuffer = await fs.readFile(outputPath);
			const uploaded_url = await uploadOutputToGallery({
				workflowId: meta?.workflowId ?? "",
				buffer: resultBuffer,
				extension: "jpg",
				contentType: "image/jpeg",
				name: `frame-${ts}.jpg`,
			});

			const output = { output: uploaded_url };
			return output;
		} finally {
			await fs.unlink(inputPath).catch(() => {});
			await fs.unlink(outputPath).catch(() => {});
		}
	},
});
