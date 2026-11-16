import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CollectionView = 'list' | 'grid'

export interface ViewSwitchProps {
  value: CollectionView
  onChange: (value: CollectionView) => void
  /** Group label; defaults to the shared "View" label. */
  label?: string
  listLabel?: string
  gridLabel?: string
  className?: string
}

/**
 * List / grid switch for collection pages: two pressed-state icon buttons in a
 * segmented track. Local stand-in until the shared ui SegmentedControl lands;
 * the props are the swap boundary, so callers do not change.
 */
export function ViewSwitch({
  value,
  onChange,
  label,
  listLabel,
  gridLabel,
  className,
}: ViewSwitchProps) {
  const { t } = useTranslation()
  const options: { value: CollectionView; label: string; icon: ReactNode }[] = [
    {
      value: 'list',
      label: listLabel ?? t('common.patterns.view.list'),
      icon: <List className="size-icon-sm" aria-hidden="true" />,
    },
    {
      value: 'grid',
      label: gridLabel ?? t('common.patterns.view.grid'),
      icon: <LayoutGrid className="size-icon-sm" aria-hidden="true" />,
    },
  ]
  return (
    <fieldset
      aria-label={label ?? t('common.patterns.view.label')}
      className={cn(
        'inline-flex h-[var(--control-height-sm)] min-w-0 shrink-0 items-stretch gap-space-2xs rounded-radius-md bg-background-subtle p-space-2xs',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            title={option.label}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex aspect-square items-center justify-center rounded-radius-sm text-text-secondary outline-hidden transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus',
              active &&
                'bg-background-surface text-text-primary shadow-elevation-low ring-1 ring-border-default',
            )}
          >
            {option.icon}
          </button>
        )
      })}
    </fieldset>
  )
}
