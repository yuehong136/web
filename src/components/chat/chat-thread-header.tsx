import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ChatThreadHeaderProps {
  title: ReactNode
  /** Who answers in this conversation (app or model), shown once here. */
  identity?: ReactNode
  actions?: ReactNode
  /** A new conversation without a title yet. */
  placeholder?: boolean
}

/** The conversation header: title, the answering identity, then actions. */
export function ChatThreadHeader({
  title,
  identity,
  actions,
  placeholder = false,
}: ChatThreadHeaderProps) {
  return (
    <header
      className={cn(
        'flex min-h-12 shrink-0 items-center gap-space-sm ps-space-md pe-space-sm',
        !placeholder && 'border-b border-border-subtle',
      )}
      data-thread-header
    >
      <h1
        className={cn(
          'min-w-0 truncate text-base',
          placeholder
            ? 'font-medium text-text-secondary'
            : 'font-semibold text-text-primary',
        )}
      >
        {title}
      </h1>
      {identity && (
        <span
          className="hidden h-6 max-w-60 min-w-0 shrink-0 items-center gap-space-xs rounded-radius-md border border-border-default bg-background-surface ps-space-xs pe-space-sm text-xs text-text-secondary sm:inline-flex"
          data-thread-identity
        >
          {identity}
        </span>
      )}
      {actions && (
        <div className="ms-auto flex shrink-0 items-center gap-space-2xs">
          {actions}
        </div>
      )}
    </header>
  )
}
