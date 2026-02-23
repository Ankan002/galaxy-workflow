import { cn } from "@/lib/utils";

const WorkflowIcon = ({ className }: { className?: string }) => (
	<svg
		viewBox="0 0 48 48"
		className={cn("size-full", className)}
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden
	>
		{/* Left node */}
		<rect x="4" y="20" width="10" height="8" rx="1" />
		{/* Central node */}
		<rect x="19" y="18" width="10" height="12" rx="1" />
		{/* Right top node */}
		<rect x="34" y="8" width="10" height="8" rx="1" />
		{/* Right bottom node */}
		<rect x="34" y="32" width="10" height="8" rx="1" />
		{/* Left connector */}
		<line x1="14" y1="24" x2="19" y2="24" />
		{/* Right connector (to top) */}
		<line x1="29" y1="22" x2="34" y2="12" />
		{/* Right connector (to bottom) */}
		<line x1="29" y1="26" x2="34" y2="36" />
	</svg>
);

export default WorkflowIcon;
