import { Skeleton } from "@/components/ui";

// Mirrors WorkflowFileCard's footprint (borderless min-h-[180px] thumbnail +
// name/timestamp below) so the grid doesn't shift when real cards load in.
const SkeletonCard = () => (
	<div className="flex w-full flex-col">
		<Skeleton className="min-h-[180px] w-full rounded-md" />
		<div className="mt-3 flex flex-col gap-1.5">
			<Skeleton className="h-3.5 w-2/3" />
			<Skeleton className="h-2.5 w-2/5" />
		</div>
	</div>
);

export default SkeletonCard;
