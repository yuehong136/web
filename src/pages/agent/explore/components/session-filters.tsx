import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExploreSessionListParams } from '../types'

interface SessionFiltersProps {
  params: ExploreSessionListParams
  onChangeParams: (patch: Partial<ExploreSessionListParams>) => void
  onClear: () => void
}

export function SessionFilters({
  params,
  onChangeParams,
  onClear,
}: SessionFiltersProps) {
  const { t } = useTranslation()
  const active = Boolean(
    params.from_date ||
    params.to_date ||
    params.orderby !== 'update_time' ||
    !params.desc,
  )
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('agent.explore.filterAndSort')}
          className={active ? 'text-text-accent' : 'text-text-secondary'}
        >
          <SlidersHorizontal className="size-icon-sm" />
          {active ? (
            <span className="sr-only">{t('agent.explore.filtersApplied')}</span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={8}
        align="start"
        className="w-80 max-w-full space-y-space-md border-border-default bg-components-console-surface p-space-base motion-reduce:animate-none"
        aria-label={t('agent.explore.filterAndSort')}
      >
        <div className="flex items-center justify-between gap-space-sm">
          <h3 className="text-sm font-medium">
            {t('agent.explore.filterAndSort')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-text-secondary"
            onClick={onClear}
          >
            {t('agent.explore.clearFilters')}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <Input
            inputSize="sm"
            type="date"
            label={t('agent.explore.fromDate')}
            value={params.from_date || ''}
            onChange={(event) =>
              onChangeParams({ from_date: event.target.value })
            }
          />
          <Input
            inputSize="sm"
            type="date"
            label={t('agent.explore.toDate')}
            value={params.to_date || ''}
            onChange={(event) =>
              onChangeParams({ to_date: event.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <Select
            value={params.orderby}
            onValueChange={(value) => onChangeParams({ orderby: value })}
          >
            <SelectTrigger aria-label={t('agent.explore.sortField')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="update_time">
                {t('agent.explore.updatedAt')}
              </SelectItem>
              <SelectItem value="create_time">
                {t('agent.explore.createdAt')}
              </SelectItem>
              <SelectItem value="name">{t('agent.explore.name')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={params.desc ? 'desc' : 'asc'}
            onValueChange={(value) =>
              onChangeParams({ desc: value === 'desc' })
            }
          >
            <SelectTrigger aria-label={t('agent.explore.sortDirection')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">
                {t('agent.explore.descending')}
              </SelectItem>
              <SelectItem value="asc">
                {t('agent.explore.ascending')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}
