import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="data-stream-shimmer flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  )
}
