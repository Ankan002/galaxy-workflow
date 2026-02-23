import { Skeleton } from "@/components/ui";

const SkeletonCard = () => (
	<div className="flex flex-col gap-3 rounded-lg border p-4">
		<Skeleton className="h-32 w-full rounded-md" />
		<Skeleton className="h-4 w-3/4" />
		<Skeleton className="h-3 w-1/2" />
	</div>
);

export default SkeletonCard;
