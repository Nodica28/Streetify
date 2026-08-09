import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="container flex h-14 items-center justify-between">
        <Skeleton className="h-4 w-40" />
      </div>
      <main className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <section className="space-y-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </section>
          <section>
            <Skeleton className="aspect-[4/3] w-full lg:aspect-auto lg:h-[640px]" />
          </section>
        </div>
      </main>
    </div>
  );
}
