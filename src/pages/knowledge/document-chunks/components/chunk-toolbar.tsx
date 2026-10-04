import {
  Ban,
  Check,
  CheckCircle,
  ChevronDown,
  ListFilter,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Input, Label } from '@/components/ui'
import { PageToolbar } from '@/components/patterns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Segmented, SegmentedItem } from '@/components/vendor/ui/segmented'
import { cn } from '@/lib/utils'
import type { ChunkFilterStatus, TextMode } from '../types'

interface ChunkToolbarProps {
  textMode: TextMode
  onTextModeChange: (mode: TextMode) => void
  searchKeyword: string
  onSearchKeywordChange: (keyword: string) => void
  filterStatus: ChunkFilterStatus
  onFilterStatusChange: (status: ChunkFilterStatus) => void
  total: number
  isAllSelected: boolean
  isPartialSelected: boolean
  selectedCount: number
  hasSelected: boolean
  onSelectAll: (checked: boolean) => void
  onBulkEnable: () => void
  onBulkDisable: () => void
  onBulkDeleteClick: () => void
  isBulkSwitchPending: boolean
  isDeletePending: boolean
  disabled?: boolean
  isRefreshing?: boolean
  onClearSelection?: () => void
}

export const ChunkToolbar = ({
  textMode,
  onTextModeChange,
  searchKeyword,
  onSearchKeywordChange,
  filterStatus,
  onFilterStatusChange,
  total,
  isAllSelected,
  isPartialSelected,
  selectedCount,
  hasSelected,
  onSelectAll,
  onBulkEnable,
  onBulkDisable,
  onBulkDeleteClick,
  isBulkSwitchPending,
  isDeletePending,
  disabled = false,
  isRefreshing = false,
  onClearSelection,
}: ChunkToolbarProps) => {
  const { t } = useTranslation()
  const filterLabels = {
    all: t('knowledge.chunks.toolbar.filterAll'),
    enabled: t('knowledge.chunks.toolbar.filterEnabled'),
    disabled: t('knowledge.chunks.toolbar.filterDisabled'),
  }
  const mutationPending = disabled || isBulkSwitchPending || isDeletePending

  return (
    <div className="shrink-0 bg-background-surface">
      <PageToolbar
        wrap
        className="gap-space-sm py-space-base"
        left={
          <div className="relative w-full max-w-sm min-w-0">
            <Input
              type="search"
              aria-label={t('knowledge.chunks.toolbar.search')}
              placeholder={t('knowledge.chunks.toolbar.searchPlaceholder')}
              value={searchKeyword}
              onChange={(event) => onSearchKeywordChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') onSearchKeywordChange('')
                if (event.key === 'Enter') event.preventDefault()
              }}
              leftIcon={<Search className="size-icon-sm" />}
              className="h-9 rounded-radius-md pr-space-xl text-sm"
              inputSize="sm"
            />
            {searchKeyword && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-0.5 right-0.5"
                onClick={() => onSearchKeywordChange('')}
                aria-label={t('knowledge.chunks.toolbar.clearSearch')}
              >
                <X className="size-icon-sm" />
              </Button>
            )}
          </div>
        }
        right={
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={t('knowledge.chunks.toolbar.filter')}
                  className={cn(
                    filterStatus !== 'all' &&
                      'border-state-focus-subtle bg-state-focus-10',
                  )}
                >
                  <ListFilter className="size-icon-sm" />
                  {filterStatus === 'all'
                    ? t('knowledge.chunks.toolbar.filter')
                    : filterLabels[filterStatus]}
                  <ChevronDown className="size-icon-xs" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-space-xs" align="end">
                <div className="flex flex-col gap-space-xs">
                  {(['all', 'enabled', 'disabled'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={filterStatus === status}
                      onClick={() => onFilterStatusChange(status)}
                      className={cn(
                        'flex items-center gap-space-sm rounded-radius-md px-space-md py-space-sm text-left text-sm focus-visible:ring-1 focus-visible:ring-state-focus focus-visible:outline-none',
                        filterStatus === status
                          ? 'bg-state-selected-bg text-state-selected-text'
                          : 'text-text-secondary hover:bg-state-hover',
                      )}
                    >
                      <span className="flex-1">{filterLabels[status]}</span>
                      {filterStatus === status && (
                        <Check className="size-icon-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Segmented
              value={textMode}
              onValueChange={(value) => onTextModeChange(value as TextMode)}
              aria-label={t('knowledge.chunks.toolbar.displayMode')}
            >
              <SegmentedItem value="ellipse">
                {t('knowledge.chunks.toolbar.ellipsis')}
              </SegmentedItem>
              <SegmentedItem value="full">
                {t('knowledge.chunks.toolbar.fullText')}
              </SegmentedItem>
            </Segmented>
          </>
        }
      />
      <PageToolbar
        wrap
        className={cn(
          'min-h-12 gap-space-sm py-space-sm',
          hasSelected && 'bg-state-focus-10',
        )}
        left={
          <div className="flex min-w-0 flex-wrap items-center gap-space-sm">
            <Checkbox
              id="select-all-chunks"
              checked={isAllSelected}
              indeterminate={isPartialSelected}
              onCheckedChange={onSelectAll}
              disabled={mutationPending || total === 0}
            />
            <Label
              htmlFor="select-all-chunks"
              className="cursor-pointer text-xs whitespace-nowrap text-text-secondary"
            >
              {t('knowledge.chunks.toolbar.selectPage')}
            </Label>
            <span
              className="text-xs whitespace-nowrap text-text-caption"
              aria-live="polite"
            >
              {hasSelected
                ? t('knowledge.chunks.toolbar.selected', {
                    count: selectedCount,
                  })
                : t('knowledge.chunks.toolbar.totalChunks', { count: total })}
            </span>
            {isRefreshing && (
              <span role="status" className="text-xs text-text-caption">
                {t('knowledge.chunks.toolbar.updating')}
              </span>
            )}
          </div>
        }
        right={
          hasSelected ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkEnable}
                disabled={mutationPending}
              >
                <CheckCircle className="size-icon-sm" />
                {t('knowledge.chunks.toolbar.enable')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkDisable}
                disabled={mutationPending}
              >
                <Ban className="size-icon-sm" />
                {t('knowledge.chunks.toolbar.disable')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkDeleteClick}
                disabled={mutationPending}
                className="text-status-error"
              >
                <Trash2 className="size-icon-sm" />
                {t('knowledge.chunks.toolbar.delete')}
              </Button>
              {onClearSelection && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClearSelection}
                  disabled={mutationPending}
                  aria-label={t('knowledge.chunks.toolbar.clearSelection')}
                >
                  <X className="size-icon-sm" />
                </Button>
              )}
            </>
          ) : undefined
        }
      />
    </div>
  )
}
