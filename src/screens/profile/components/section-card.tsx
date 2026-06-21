"use client";

import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface SectionCardProps {
	title: string;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
}

/** Consistent profile card: hairline-divided header, flat body, optional footer. */
export const SectionCard: React.FC<SectionCardProps> = ({
	title,
	description,
	children,
	footer,
	className,
}) => {
	return (
		<Card padding="none" className={cn("overflow-hidden", className)}>
			<div className="border-b border-border px-6 py-5">
				<h2 className="font-sans text-base font-semibold tracking-tight text-foreground">
					{title}
				</h2>
				{description && (
					<p className="mt-1 text-sm text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			<div className="px-6 py-6">{children}</div>
			{footer && (
				<div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
					{footer}
				</div>
			)}
		</Card>
	);
};

/** UPPERCASE mono field label in the aakriti voice. */
export const FieldLabel: React.FC<
	React.LabelHTMLAttributes<HTMLLabelElement>
> = ({ className, ...props }) => (
	<label className={cn("ak-eyebrow text-[0.65rem]", className)} {...props} />
);
