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
        'rounded-radius-md border border-border-subtle bg-background-subtle px-space-sm py-space-xs text-xs leading-5 text-text-secondary',
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
