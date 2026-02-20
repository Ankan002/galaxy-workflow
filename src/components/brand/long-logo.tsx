import { cn } from "@/lib/utils";
import { Logo } from "./logo";

interface Props {
	logoClassName?: string;
	className?: string;
}

const LongLogo = ({ logoClassName, className }: Props) => {
	return (
		<div className={cn("flex items-center gap-2 font-sans", className)}>
			<Logo className={logoClassName} />
			<span className="text-lg">Weavy</span>
		</div>
	);
};

export default LongLogo;
