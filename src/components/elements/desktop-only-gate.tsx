"use client";

import { useCallback, useState } from "react";
import { Copy } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const APP_NAME = "aakriti";

export function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
	return (
		<>
			{/* Gate: visible only below desktop (lg = 1024px) */}
			<div
				className={cn(
					"fixed inset-0 z-100 flex flex-col bg-ink text-paper",
					"lg:hidden",
				)}
			>
				<div className="flex min-h-full flex-col px-6 py-10 sm:px-8 sm:py-12">
					<Logo className="size-10 shrink-0" />
					<div className="mt-10 flex flex-1 flex-col sm:mt-14">
						<h1 className="font-display text-3xl leading-tight sm:text-4xl">
							Your masterpiece needs a bigger canvas
						</h1>
						<p className="mt-4 max-w-sm text-sm text-paper/90 sm:text-base">
							Open {APP_NAME} on desktop to start building your
							workflow.
						</p>
						<CopyLinkButton className="mt-6" />
						<p className="mt-10 text-xs text-paper/70">
							In the meantime...
						</p>
					</div>
				</div>
			</div>
			{children}
		</>
	);
}

function CopyLinkButton({ className }: { className?: string }) {
	const [copied, setCopied] = useState(false);

	const copyLink = useCallback(() => {
		if (typeof window === "undefined") return;
		const url = window.location.href;
		void navigator.clipboard.writeText(url).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, []);

	return (
		<Button
			type="button"
			variant="outline"
			className={cn(
				"inline-flex h-10 items-center gap-2 border-paper/40 bg-transparent text-paper hover:bg-paper/10 hover:text-paper",
				className,
			)}
			onClick={copyLink}
			aria-label="Copy link"
		>
			<Copy className="size-4" aria-hidden />
			<span>{copied ? "Copied!" : "Copy link"}</span>
		</Button>
	);
}
