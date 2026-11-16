import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, Search, X } from 'lucide-react'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuLabel,
  ActionMenuRadioGroup,
  ActionMenuRadioItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  FilterChip,
  type FilterDefinition,
  type FilterOption,
} from './filter-chip'
import { ViewSwitch, type CollectionView } from './view-switch'

export type { FilterDefinition, FilterOption } from './filter-chip'

export interface FilterBarSearch {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Accessible name; defaults to the placeholder. */
  label?: string
}

/** One single-choice group inside the sort menu. */
export interface FilterBarChoice {
  key: string
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}

export interface FilterBarProps {
  search?: FilterBarSearch
  /** Filter chips, in display order. Their values are fully controlled. */
  filters?: FilterDefinition[]
  onFilterChange?: (key: string, value: string[]) => void
  /** Shown once any chip is set; clears search-independent filters. */
  onClearFilters?: () => void
  /** The one sort menu. Its trigger shows the current sort option. */
  sort?: Omit<FilterBarChoice, 'key' | 'label'> & { label?: string }
  /** Extra display choices listed in the same menu (e.g. time format). */
  display?: FilterBarChoice[]
  view?: { value: CollectionView; onChange: (value: CollectionView) => void }
  /** Extra trailing controls. Prefer the slots above before adding here. */
  actions?: ReactNode
  className?: string
}

/**
 * The collection toolbar: search, filter chips, one sort menu and the
 * list/grid switch, always in that order. Presentational only — callers own
 * every value and decide whether filtering is server- or page-scoped.
 */
export function FilterBar({
  search,
  filters = [],
  onFilterChange,
  onClearFilters,
  sort,
  display = [],
  view,
  actions,
  className,
}: FilterBarProps) {
  const { t } = useTranslation()
  const anySet = filters.some((filter) => filter.value.length > 0)
  const sortTitle = sort?.label ?? t('common.patterns.filterBar.sort')
  const sortLabel = sort?.options.find(
    (option) => option.value === sort.value,
  )?.label
  const menuGroups: FilterBarChoice[] = [
    ...(sort ? [{ ...sort, key: 'sort', label: sortTitle }] : []),
    ...display,
  ]
  return (
    <div
      data-slot="filter-bar"
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-space-sm',
        className,
      )}
    >
      {search ? (
        <div className="w-full sm:w-56">
          <Input
            type="search"
            inputSize="sm"
            aria-label={search.label ?? search.placeholder}
            placeholder={search.placeholder}
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
          />
        </div>
      ) : null}
      {filters.map((filter) => (
        <FilterChip
          key={filter.key}
          filter={filter}
          onChange={(value) => onFilterChange?.(filter.key, value)}
        />
      ))}
      {anySet && onClearFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-text-secondary"
          onClick={onClearFilters}
        >
          <X className="size-icon-xs" aria-hidden="true" />
          {t('common.patterns.filterBar.clearFilters')}
        </Button>
      ) : null}
      <span className="min-w-0 flex-1" aria-hidden="true" />
      {actions}
      {menuGroups.length ? (
        <ActionMenu>
          <ActionMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-slot="filter-bar-sort"
              aria-label={sortLabel ? `${sortTitle}: ${sortLabel}` : sortTitle}
              className="text-xs font-normal text-text-secondary"
            >
              <ArrowUpDown className="size-icon-sm" aria-hidden="true" />
              {sortLabel ?? sortTitle}
            </Button>
          </ActionMenuTrigger>
          <ActionMenuContent align="end" className="min-w-52">
            {menuGroups.map((group, index) => (
              <Fragment key={group.key}>
                {index > 0 ? <ActionMenuSeparator /> : null}
                <ActionMenuLabel className="px-space-sm py-space-xs text-xs text-text-tertiary">
                  {group.label}
                </ActionMenuLabel>
                <ActionMenuRadioGroup
                  value={group.value}
                  onValueChange={group.onChange}
                >
                  {group.options.map((option) => (
                    <ActionMenuRadioItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </ActionMenuRadioItem>
                  ))}
                </ActionMenuRadioGroup>
              </Fragment>
            ))}
          </ActionMenuContent>
        </ActionMenu>
      ) : null}
      {view ? <ViewSwitch value={view.value} onChange={view.onChange} /> : null}
    </div>
  )
}
