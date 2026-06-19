"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * aakriti brand mark — the Devanagari आ ("aa") set in a marigold tile with a
 * 2px ink border. Rendered as a scalable SVG so it sizes cleanly via `size-*`
 * utilities and keeps the original `forwardRef<SVGSVGElement>` API.
 */
const Logo = React.forwardRef<SVGSVGElement, React.SVGAttributes<SVGSVGElement>>(
	({ className, ...props }, ref) => (
		<svg
			ref={ref}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			fill="none"
			role="img"
			aria-label="aakriti"
			className={cn("size-8 shrink-0 select-none", className)}
			{...props}
		>
			<rect
				x="1.5"
				y="1.5"
				width="29"
				height="29"
				rx="5"
				fill="var(--ak-marigold)"
				stroke="var(--ak-ink)"
				strokeWidth="2"
			/>
			<text
				x="16"
				y="17.5"
				textAnchor="middle"
				dominantBaseline="central"
				fontFamily="var(--font-devanagari)"
				fontSize="21"
				fill="var(--ak-ink)"
			>
				आ
			</text>
		</svg>
	),
);

Logo.displayName = "Logo";

export { Logo };
