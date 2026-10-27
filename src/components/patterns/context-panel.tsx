import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CloseAction =
  | { onClose: () => void; closeLabel: string }
  | { onClose?: never; closeLabel?: never }
export type ContextPanelProps = Omit<HTMLAttributes<HTMLElement>, 'title'> &
  CloseAction & {
    title: ReactNode
    description?: ReactNode
    actions?: ReactNode
    footer?: ReactNode
    width?: 'sm' | 'md' | 'lg' | 'full'
    scroll?: 'auto' | 'none'
    bodyClassName?: string
    headerClassName?: string
    titleId?: string
  }
const widths = { sm: 'w-72', md: 'w-80', lg: 'w-96', full: 'w-full' } as const

/** A composable task detail surface with one body scroll owner and persistent controls. */
export function ContextPanel({
  title,
  description,
  actions,
  footer,
  width = 'md',
  scroll = 'auto',
  onClose,
  closeLabel,
  children,
  className,
  bodyClassName,
  headerClassName,
  titleId,
  ...props
}: ContextPanelProps) {
  const generatedId = useId()
  const headingId = titleId ?? generatedId
  return (
    <aside
      aria-labelledby={headingId}
      data-context-panel
      className={cn(
        'flex h-full min-h-0 max-w-full min-w-0 shrink-0 flex-col overflow-hidden border-l border-border-subtle bg-background-surface text-text-primary',
        widths[width],
        className,
      )}
      {...props}
    >
      <header
        className={cn(
          'flex shrink-0 items-start gap-space-sm border-b border-border-subtle p-space-md',
          headerClassName,
        )}
      >
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-base leading-snug font-semibold">
            {title}
          </h2>
          {description && (
            <div className="mt-space-xs text-sm leading-relaxed text-text-secondary">
              {description}
            </div>
          )}
        </div>
        {actions}
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X className="size-icon-sm" aria-hidden="true" />
          </Button>
        )}
      </header>
      <div
        data-context-panel-body
        className={cn(
          'min-h-0 min-w-0 flex-1 p-space-md',
          scroll === 'auto'
            ? 'overflow-y-auto overscroll-contain'
            : 'overflow-hidden',
          bodyClassName,
        )}
      >
        {children}
      </div>
      {footer && (
        <footer className="shrink-0 border-t border-border-subtle p-space-md">
          {footer}
        </footer>
      )}
    </aside>
  )
}
