import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface BulkActionBarProps {
  /** Number of selected items; the bar hides at 0. */
  count: number
  /** Action buttons (size="sm"); put destructive actions last. */
  children: ReactNode
  onClear: () => void
  /** Overrides the "{{count}} selected" caption. */
  label?: ReactNode
  /** Toolbar name; defaults to "Bulk actions". */
  ariaLabel?: string
  /** `floating` docks bottom-centre over a relative container; `inline` flows. */
  placement?: 'floating' | 'inline'
  className?: string
}

/**
 * Selection toolbar: "2 selected · actions · ×". Floating by default inside
 * `CollectionTemplate`'s body so the list keeps its position.
 */
export function BulkActionBar({
  count,
  children,
  onClear,
  label,
  ariaLabel,
  placement = 'floating',
  className,
}: BulkActionBarProps) {
  const { t } = useTranslation()
  if (count <= 0) return null
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel ?? t('common.patterns.bulk.label')}
      data-slot="bulk-action-bar"
      className={cn(
        'flex max-w-full items-center gap-space-2xs rounded-radius-xl border border-line bg-surface py-space-xs pr-space-xs pl-space-base text-sm',
        placement === 'floating'
          ? 'absolute bottom-space-md left-1/2 z-20 w-max max-w-[calc(100%-var(--space-md)*2)] -translate-x-1/2 shadow-elevation-high'
          : 'shadow-elevation-low',
        className,
      )}
    >
      <span
        aria-live="polite"
        className="mr-space-sm font-semibold whitespace-nowrap tabular-nums"
      >
        {label ?? t('common.patterns.bulk.selected', { count })}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-space-2xs">
        {children}
      </div>
      <span
        aria-hidden="true"
        className="mx-space-xs h-4 w-px shrink-0 bg-line"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('common.patterns.bulk.clear')}
        onClick={onClear}
      >
        <X className="size-icon-sm" aria-hidden="true" />
      </Button>
    </div>
  )
}
