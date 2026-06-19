import { cn } from "@/lib/utils";
import { Logo } from "./logo";

interface Props {
	logoClassName?: string;
	className?: string;
}

const LongLogo = ({ logoClassName, className }: Props) => {
	return (
		<div className={cn("flex items-center gap-2.5", className)}>
			<Logo className={cn("size-9", logoClassName)} />
			<span className="font-display text-2xl lowercase tracking-tight text-foreground">
				aakriti
			</span>
		</div>
	);
};

export default LongLogo;
