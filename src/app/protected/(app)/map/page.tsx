import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import MapClient from "./map-client";

export default function MapPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MapClient />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="flex-1 rounded-3xl" />
    </div>
  );
}