import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-4 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export { Skeleton, TableSkeleton, CardSkeleton, DetailSkeleton };
