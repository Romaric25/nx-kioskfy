import { NewspaperCardSkeleton } from "@/components/home/newspaper-card-skeleton";

export function NewspapersGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <NewspaperCardSkeleton key={index} />
      ))}
    </div>
  );
}
