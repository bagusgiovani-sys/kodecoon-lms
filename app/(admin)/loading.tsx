import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="data-stream-shimmer flex flex-col gap-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64" />
    </div>
  )
}
