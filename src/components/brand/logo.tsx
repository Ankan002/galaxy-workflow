"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Logo = React.forwardRef<
	SVGSVGElement,
	React.SVGAttributes<SVGSVGElement>
>(({ className, ...props }, ref) => (
	<svg
		ref={ref}
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 32 32"
		fill="none"
		role="img"
		aria-label="Logo"
		className={cn("size-8 shrink-0 select-none", className)}
		{...props}
	>
		<circle
			cx="16"
			cy="16"
			r="9"
			stroke="#f7ffa8"
			strokeWidth="2"
			fill="none"
		/>
		<circle cx="16" cy="16" r="4.5" fill="#f7ffa8" />
		<circle cx="16" cy="5.5" r="2.25" fill="#a040e9" />
		<circle cx="25" cy="16" r="2.25" fill="#05b246" />
		<circle cx="16" cy="26.5" r="2.25" fill="#653fe1" />
	</svg>
));

Logo.displayName = "Logo";

export { Logo };
