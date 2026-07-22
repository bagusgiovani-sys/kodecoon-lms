import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  action?: React.ReactNode
}

// Every list screen gets a designed empty state, never a blank one (PRD)
export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
      <Icon className="text-muted-foreground/60 size-10" aria-hidden />
      <p className="text-muted-foreground max-w-sm text-sm">{message}</p>
      {action}
    </div>
  )
}
