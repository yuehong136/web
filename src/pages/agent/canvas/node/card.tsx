import { cn } from '@/lib/utils'
import type { PropsWithChildren } from 'react'

type LabelCardProps = {
  className?: string
} & PropsWithChildren &
  React.HTMLAttributes<HTMLElement>

export function LabelCard({ children, className, ...props }: LabelCardProps) {
  return (
    <div
      className={cn(
        'bg-surface-secondary rounded-radius-sm px-space-xs py-0.5 text-text-secondary text-xs',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function LLMLabelCard({ llmId }: { llmId?: string }) {
  return (
    <LabelCard>
      {llmId || 'Default LLM'}
    </LabelCard>
  )
}
