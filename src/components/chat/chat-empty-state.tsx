import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ChatSuggestion {
  id: string
  /** Chip text. */
  label: string
  /** Draft it prefills; nothing runs until the user sends. */
  prompt: string
  icon?: ReactNode
}

export interface ChatEmptyStateProps {
  title: ReactNode
  description?: ReactNode
  /** Above the title, e.g. the app avatar. */
  leading?: ReactNode
  /** Under the description, e.g. the app's configured opening message. */
  intro?: ReactNode
  composer: ReactNode
  suggestions?: ChatSuggestion[]
  suggestionsLabel?: string
  onSuggestion?: (prompt: string) => void
  /** Below the suggestions, e.g. recent conversations. */
  footer?: ReactNode
  className?: string
}

/** New conversation: a short greeting, the composer, one row of suggestions. */
export function ChatEmptyState({
  title,
  description,
  leading,
  intro,
  composer,
  suggestions = [],
  suggestionsLabel,
  onSuggestion,
  footer,
  className,
}: ChatEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-y-auto px-space-md sm:px-space-xl',
        className,
      )}
      data-chat-empty
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-space-md py-space-xl">
        <div className="space-y-space-xs">
          {leading}
          <h1 className="text-xl leading-snug font-semibold text-fg">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-fg-muted">{description}</p>
          )}
          {intro}
        </div>
        {composer}
        {suggestions.length > 0 && (
          <ul
            aria-label={suggestionsLabel}
            className="scrollbar-none flex min-w-0 gap-space-sm overflow-x-auto pb-space-2xs"
          >
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="shrink-0">
                <button
                  type="button"
                  title={suggestion.prompt}
                  onClick={() => onSuggestion?.(suggestion.prompt)}
                  className="inline-flex min-h-[var(--control-height)] items-center gap-space-xs rounded-radius-lg border border-line bg-surface px-space-base text-sm text-fg-muted transition-colors hover:border-line-strong hover:bg-fill-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus [&_svg]:size-icon-sm [&_svg]:shrink-0"
                >
                  {suggestion.icon}
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {footer}
      </div>
    </div>
  )
}
