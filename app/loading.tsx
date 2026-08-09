import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container flex min-h-screen flex-col justify-center gap-8 py-10">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-3/4 max-w-2xl" />
      </div>
      <Skeleton className="h-16 w-full max-w-3xl" />
    </div>
  );
}
