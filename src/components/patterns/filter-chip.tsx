import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuLabel,
  ActionMenuRadioGroup,
  ActionMenuRadioItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDefinition {
  key: string
  label: string
  options: FilterOption[]
  /** Selected values; an empty array means the filter is not set. */
  value: string[]
  /** `single` replaces the value and closes the menu; `multiple` toggles. */
  selection?: 'single' | 'multiple'
}

export interface FilterChipProps {
  filter: FilterDefinition
  onChange: (value: string[]) => void
}

/**
 * A dashed chip while unset, a filled "Label value" chip once set. The menu
 * keeps multi-select open between toggles and ends with a clear action.
 */
export function FilterChip({ filter, onChange }: FilterChipProps) {
  const { t } = useTranslation()
  const selected = filter.options.filter((option) =>
    filter.value.includes(option.value),
  )
  const set = selected.length > 0
  const summary = set
    ? selected.length === 1
      ? selected[0].label
      : t('common.patterns.filterBar.moreValues', {
          value: selected[0].label,
          count: selected.length - 1,
        })
    : null
  const toggle = (value: string) =>
    onChange(
      filter.value.includes(value)
        ? filter.value.filter((item) => item !== value)
        : [...filter.value, value],
    )
  let items: ReactNode
  if (filter.selection === 'single') {
    items = (
      <ActionMenuRadioGroup
        value={filter.value[0] ?? ''}
        onValueChange={(value) => onChange(value ? [value] : [])}
      >
        {filter.options.map((option) => (
          <ActionMenuRadioItem key={option.value} value={option.value}>
            {option.label}
          </ActionMenuRadioItem>
        ))}
      </ActionMenuRadioGroup>
    )
  } else {
    items = filter.options.map((option) => {
      const checked = filter.value.includes(option.value)
      return (
        <ActionMenuItem
          key={option.value}
          role="menuitemcheckbox"
          aria-checked={checked}
          onSelect={(event) => {
            event.preventDefault()
            toggle(option.value)
          }}
        >
          {option.label}
          <span className="ml-auto flex size-icon-sm items-center justify-center">
            {checked ? (
              <Check className="size-icon-sm" aria-hidden="true" />
            ) : null}
          </span>
        </ActionMenuItem>
      )
    })
  }
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-filter-key={filter.key}
          data-filter-set={set || undefined}
          className={cn(
            'border border-dashed border-border-strong text-xs font-normal text-text-secondary',
            set &&
              'border-solid border-border-default bg-background-subtle text-text-primary',
          )}
        >
          <span className={cn(set && 'text-text-tertiary')}>
            {filter.label}
          </span>
          {summary ? (
            <span className="max-w-40 truncate">{summary}</span>
          ) : null}
          <ChevronDown className="size-icon-xs" aria-hidden="true" />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="start" className="min-w-44">
        <ActionMenuLabel className="px-space-sm py-space-xs text-xs text-text-tertiary">
          {filter.label}
        </ActionMenuLabel>
        {items}
        {set ? (
          <>
            <ActionMenuSeparator />
            <ActionMenuItem onSelect={() => onChange([])}>
              {t('common.patterns.filterBar.clearFilter')}
            </ActionMenuItem>
          </>
        ) : null}
      </ActionMenuContent>
    </ActionMenu>
  )
}
