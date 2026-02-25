"use client";

import { useCallback, useState } from "react";
import { Copy } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const APP_NAME = "Galaxy Workflow";

export function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
	return (
		<>
			{/* Gate: visible only below desktop (lg = 1024px) */}
			<div
				className={cn(
					"fixed inset-0 z-100 flex flex-col bg-black text-white",
					"lg:hidden",
				)}
			>
				<div className="flex min-h-full flex-col px-6 py-10 sm:px-8 sm:py-12">
					<Logo className="size-10 shrink-0" />
					<div className="mt-10 flex flex-1 flex-col sm:mt-14">
						<h1 className="text-2xl font-bold leading-tight sm:text-3xl">
							Your masterpiece needs a bigger canvas
						</h1>
						<p className="mt-4 max-w-sm text-sm text-white/90 sm:text-base">
							Open {APP_NAME} on desktop to start building your
							workflow.
						</p>
						<CopyLinkButton className="mt-6" />
						<p className="mt-10 text-xs text-white/70">
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
				"inline-flex h-10 items-center gap-2 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
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
