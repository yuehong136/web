import { cn } from '@/lib/utils'

interface AgentBackgroundProps {
  className?: string
}

export function AgentBackground({ className }: AgentBackgroundProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 bg-surface-secondary',
        className,
      )}
    />
  )
}

