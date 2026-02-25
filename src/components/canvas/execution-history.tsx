"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, ChevronRight } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
	useGetWorkflowExecutions,
	useGetWorkflowExecution,
	type NodeExecutionWithNode,
	type WorkflowExecutionWithNodes,
} from "@/services/client-api/workflow-executions";
import {
	ExecutionStatusBadge,
	ExecutionStatusIcon,
} from "./execution-status";

const LLM_PREVIEW_CHARS = 280;

const NODE_TYPE_LABEL: Record<string, string> = {
	run_llm: "LLM Node",
	crop_image: "Crop Image",
	extract_video_frame: "Extract Video Frame",
	text: "Text",
	image_upload: "Image Upload",
	video_upload: "Video Upload",
};

function formatRunDate(createdAt: string): string {
	const d = new Date(createdAt);
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function formatDuration(createdAt: string, updatedAt: string): string {
	const ms =
		new Date(updatedAt).getTime() - new Date(createdAt).getTime();
	const s = ms / 1000;
	if (s < 1) return `${Math.round(ms)}ms`;
	return `${s.toFixed(1)}s`;
}

function isImageUrl(s: string): boolean {
	try {
		const u = new URL(s);
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

function getImageUrl(output: unknown): string | null {
	if (output == null) return null;
	if (typeof output === "string" && isImageUrl(output)) return output;
	if (typeof output === "object" && output !== null) {
		const o = output as Record<string, unknown>;
		for (const key of ["uploaded_url", "image", "output"]) {
			const v = o[key];
			if (typeof v === "string" && isImageUrl(v)) return v;
		}
	}
	return null;
}

function getVideoUrl(output: unknown): string | null {
	if (output == null) return null;
	if (typeof output === "string" && isImageUrl(output)) return output;
	if (typeof output === "object" && output !== null) {
		const o = output as Record<string, unknown>;
		const v = o["url"];
		if (typeof v === "string" && isImageUrl(v)) return v;
	}
	return null;
}

/** For LLM node: show only the response (or text) value, not the whole JSON. */
function getLLMText(output: unknown): string | null {
	if (output == null || typeof output !== "object") return null;
	const o = output as Record<string, unknown>;
	if (typeof o.response === "string") return o.response;
	if (typeof o.text === "string") return o.text;
	return null;
}

const LLM_ANSWER_KEYS = ["response", "answer", "result", "content", "text"];

function tryParseLLMJson(
	text: string,
): { parsed: unknown; formatted: string; answer: string | null } | null {
	const trimmed = text.trim();
	// Accept optional leading/trailing code fence or "json" tag
	let toParse = trimmed;
	const jsonMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/);
	if (jsonMatch) toParse = jsonMatch[1].trim();
	try {
		const parsed = JSON.parse(toParse) as unknown;
		const formatted =
			typeof parsed === "object" && parsed !== null
				? JSON.stringify(parsed, null, 2)
				: String(parsed);
		let answer: string | null = null;
		if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
			const obj = parsed as Record<string, unknown>;
			for (const key of LLM_ANSWER_KEYS) {
				const v = obj[key];
				if (typeof v === "string") {
					answer = v;
					break;
				}
			}
			if (answer == null) {
				const first = Object.values(obj).find((v) => typeof v === "string");
				if (typeof first === "string") answer = first;
			}
		} else if (typeof parsed === "string") {
			answer = parsed;
		}
		return { parsed, formatted, answer };
	} catch {
		return null;
	}
}

function outputPreview(output: unknown): string {
	if (output == null) return "";
	if (typeof output === "string") return output;
	if (typeof output === "object" && output !== null) {
		const o = output as Record<string, unknown>;
		if (typeof o.text === "string") return o.text;
		if (typeof o.value === "string") return o.value;
		if (typeof o.output === "string") return o.output;
		if (typeof o.uploaded_url === "string") return o.uploaded_url;
		if (typeof o.url === "string") return o.url;
		if (typeof o.image === "string") return o.image;
		return JSON.stringify(output);
	}
	return String(output);
}

function errorPreview(error: unknown): string {
	if (error == null) return "";
	if (typeof error === "string") return error;
	return JSON.stringify(error);
}

export interface ExecutionHistoryProps {
	workflowId: string;
}

export function ExecutionHistory({ workflowId }: ExecutionHistoryProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const { data: executions, isLoading: isLoadingList } =
		useGetWorkflowExecutions({
			workflowId,
			limit: 50,
		});

	const { data: expandedExecution, isLoading: isLoadingDetail } =
		useGetWorkflowExecution({
			workflowId,
			executionId: expandedId,
			// Poll while an execution is expanded so we update when webhook completes
			refetchInterval: expandedId ? 2000 : undefined,
		});

	const runList = useMemo(
		() => (executions ?? []).slice(0, 50),
		[executions],
	);

	const accordionValue = expandedId ?? "";
	const onAccordionChange = (value: string) =>
		setExpandedId(value || null);

	if (!workflowId) return null;

	return (
		<div className="flex h-full min-h-0 flex-col gap-2">
			<h3 className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Execution history
			</h3>
			{isLoadingList ? (
				<div className="flex items-center gap-2 py-2 text-muted-foreground">
					<Loader2 className="size-3.5 animate-spin" />
					<span className="text-xs">Loading runs…</span>
				</div>
			) : runList.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					No runs yet. Run a node or run the full flow to see history.
				</p>
			) : (
				<Accordion
					type="single"
					value={accordionValue}
					onValueChange={onAccordionChange}
					className="min-h-0 flex-1"
					collapsible
				>
					{runList.map((run, index) => (
						<AccordionItem
							key={run.id}
							value={run.id}
							className="border-sidebar-border"
						>
							<AccordionTrigger className="py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180">
								<div className="flex flex-col gap-0.5 text-left">
									<div className="flex items-center gap-2">
										<span className="text-xs font-medium text-foreground">
											Run #{runList.length - index}
										</span>
										<ExecutionStatusBadge
											status={run.status}
											showIcon={true}
											className="shrink-0"
										/>
									</div>
									<span className="block truncate text-xs text-muted-foreground">
										{formatRunDate(run.created_at)}{" "}
										{run.execution_type === "full"
											? "(Full flow)"
											: "(Single Node)"}
									</span>
								</div>
							</AccordionTrigger>
							<AccordionContent className="pb-2 pt-0">
								{expandedId === run.id &&
									(isLoadingDetail ? (
										<div className="flex items-center gap-2 py-3 text-muted-foreground">
											<Loader2 className="size-4 animate-spin" />
											<span className="text-xs">
												Loading run…
											</span>
										</div>
									) : expandedExecution ? (
										<RunDetail
											execution={expandedExecution}
										/>
									) : null)}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			)}
		</div>
	);
}

function RunDetail({
	execution,
}: {
	execution: WorkflowExecutionWithNodes;
}) {
	return (
		<Card variant="outline" padding="sm" className="overflow-hidden">
			<CardHeader className="space-y-0 pb-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<span className="text-xs font-medium text-muted-foreground">
						Result
					</span>
					<ExecutionStatusBadge
						status={execution.status}
						showIcon={true}
						className="shrink-0"
					/>
				</div>
			</CardHeader>
			<Separator variant="muted" className="mb-2" />
			<CardContent className="space-y-2 p-0">
				{execution.node_executions.map((ne) => (
					<NodeExecutionItem key={ne.id} nodeExecution={ne} />
				))}
			</CardContent>
		</Card>
	);
}

function NodeExecutionItem({
	nodeExecution,
}: {
	nodeExecution: NodeExecutionWithNode;
}) {
	const label =
		NODE_TYPE_LABEL[nodeExecution.node.type] ?? nodeExecution.node.type;
	const status = nodeExecution.status as string;

	const duration =
		status === "completed" || status === "failed"
			? formatDuration(
					nodeExecution.created_at,
					nodeExecution.updated_at,
				)
			: null;

	const nodeType = nodeExecution.node.type as string;
	const outputStr = outputPreview(nodeExecution.output);
	const errorStr = errorPreview(nodeExecution.error);

	const videoUrl =
		nodeType === "video_upload" ? getVideoUrl(nodeExecution.output) : null;
	const imageUrl =
		nodeType === "image_upload" ||
		nodeType === "crop_image" ||
		nodeType === "extract_video_frame"
			? getImageUrl(nodeExecution.output)
			: null;
	const llmText =
		nodeType === "run_llm" ? getLLMText(nodeExecution.output) : null;
	const llmJson = llmText != null ? tryParseLLMJson(llmText) : null;
	const [llmModalOpen, setLlmModalOpen] = useState(false);
	// For JSON: show only the extracted answer (markdown); for plain text use full/truncated llmText
	const llmMarkdownPreview =
		llmJson?.answer != null
			? llmJson.answer.length > LLM_PREVIEW_CHARS
				? `${llmJson.answer.slice(0, LLM_PREVIEW_CHARS)}…`
				: llmJson.answer
			: null;
	const showLlmReadMore =
		llmJson != null && llmJson.answer != null
			? llmJson.answer.length > LLM_PREVIEW_CHARS
			: (llmText != null && llmText.length > LLM_PREVIEW_CHARS);
	const llmPreview =
		llmText != null && llmText.length > LLM_PREVIEW_CHARS
			? llmText.slice(0, LLM_PREVIEW_CHARS) + "…"
			: llmText ?? "";

	return (
		<div className="rounded-md border border-border/60 bg-muted/30 p-2">
			<div className="flex min-w-0 items-center gap-2">
				<ExecutionStatusIcon status={status} />
				<span className="min-w-0 truncate text-xs font-medium text-foreground">
					{label}
				</span>
				{duration != null && (
					<span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
						{duration}
					</span>
				)}
			</div>
			{(outputStr || errorStr) && (
				<div className="mt-2 overflow-x-auto rounded bg-background/80 px-2 py-1.5 text-xs">
					{errorStr ? (
						<p className="text-destructive wrap-break-word">
							{errorStr}
						</p>
					) : (
						<>
							{llmText != null && (
								<div className="mb-2">
									{llmJson != null && llmJson.answer != null ? (
										<>
											<div className="llm-markdown text-muted-foreground wrap-break-word [&_a]:text-primary [&_a]:underline [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ul]:list-inside [&_ol]:list-inside [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-sm">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>
													{showLlmReadMore
														? (llmMarkdownPreview ?? llmJson.answer)
														: llmJson.answer}
												</ReactMarkdown>
											</div>
											{showLlmReadMore && (
												<>
													<button
														type="button"
														onClick={() => setLlmModalOpen(true)}
														className="mt-1 flex items-center gap-0.5 text-xs text-primary hover:underline"
													>
														Know more
														<ChevronRight className="size-3.5" />
													</button>
													<Dialog
														open={llmModalOpen}
														onOpenChange={setLlmModalOpen}
													>
														<DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
															<DialogHeader>
																<DialogTitle>LLM Response</DialogTitle>
															</DialogHeader>
															<div className="llm-markdown min-h-0 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ul]:list-inside [&_ol]:list-inside [&_h1]:text-base [&_h2]:text-base [&_h3]:text-base">
																<ReactMarkdown remarkPlugins={[remarkGfm]}>
																	{llmJson.answer}
																</ReactMarkdown>
															</div>
														</DialogContent>
													</Dialog>
												</>
											)}
										</>
									) : (
										<>
											<div className="llm-markdown text-muted-foreground wrap-break-word [&_a]:text-primary [&_a]:underline [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ul]:list-inside [&_ol]:list-inside [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-sm">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>
													{llmPreview}
												</ReactMarkdown>
											</div>
											{showLlmReadMore && (
												<>
													<button
														type="button"
														onClick={() => setLlmModalOpen(true)}
														className="mt-1 flex items-center gap-0.5 text-xs text-primary hover:underline"
													>
														Know more
														<ChevronRight className="size-3.5" />
													</button>
													<Dialog
														open={llmModalOpen}
														onOpenChange={setLlmModalOpen}
													>
														<DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
															<DialogHeader>
																<DialogTitle>LLM Response</DialogTitle>
															</DialogHeader>
															<div className="llm-markdown min-h-0 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ul]:list-inside [&_ol]:list-inside [&_h1]:text-base [&_h2]:text-base [&_h3]:text-base">
																<ReactMarkdown remarkPlugins={[remarkGfm]}>
																	{llmText}
																</ReactMarkdown>
															</div>
														</DialogContent>
													</Dialog>
												</>
											)}
										</>
									)}
								</div>
							)}
							{videoUrl != null && (
								<div className="mb-2 space-y-1">
									<video
										src={videoUrl}
										controls
										className="max-h-40 max-w-full rounded border border-border object-contain"
										preload="metadata"
									/>
								</div>
							)}
							{imageUrl != null && (
								<div className="mb-2">
									<img
										src={imageUrl}
										alt="Preview"
										className="max-h-40 max-w-full rounded border border-border object-contain"
									/>
								</div>
							)}
							{llmText == null && (
								<p className="wrap-break-word text-muted-foreground">
									{outputStr.length > 200
										? `${outputStr.slice(0, 200)}…`
										: outputStr}
								</p>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
