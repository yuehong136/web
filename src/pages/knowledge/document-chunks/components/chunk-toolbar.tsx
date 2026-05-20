import {
  CheckCircle,
  Ban,
  ListFilter,
  PanelLeftOpen,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Input, Label, Tooltip } from '@/components/ui'
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
  isPreviewPanelOpen: boolean
  onOpenPreviewPanel: () => void
  isSearchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
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
  onAddChunk: () => void
}

export const ChunkToolbar = ({
  textMode,
  onTextModeChange,
  isPreviewPanelOpen,
  onOpenPreviewPanel,
  isSearchOpen,
  onSearchOpenChange,
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
  onAddChunk,
}: ChunkToolbarProps) => {
  const { t } = useTranslation()
  const filterLabel =
    filterStatus === 'enabled'
      ? t('knowledge.chunks.toolbar.filterEnabled')
      : t('knowledge.chunks.toolbar.filterDisabled')

  return (
    <div className="border-b border-border-default px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isPreviewPanelOpen && (
            <Tooltip content={t('knowledge.chunks.toolbar.showPreview')}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenPreviewPanel}
                className="hidden lg:flex"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}

          <Segmented
            value={textMode}
            onValueChange={(value) => onTextModeChange(value as TextMode)}
          >
            <SegmentedItem value="full">
              {t('knowledge.chunks.toolbar.fullText')}
            </SegmentedItem>
            <SegmentedItem value="ellipse">
              {t('knowledge.chunks.toolbar.ellipsis')}
            </SegmentedItem>
          </Segmented>
        </div>

        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <Input
                type="search"
                placeholder={t('knowledge.chunks.toolbar.searchPlaceholder')}
                value={searchKeyword}
                onChange={(event) => onSearchKeywordChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                  }
                  if (event.key === 'Escape') {
                    onSearchOpenChange(false)
                    onSearchKeywordChange('')
                  }
                }}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-48"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSearchOpenChange(false)
                  onSearchKeywordChange('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Tooltip content={t('knowledge.chunks.toolbar.search')}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchOpenChange(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(filterStatus !== 'all' && 'text-text-accent')}
                aria-label={t('knowledge.chunks.toolbar.filter')}
              >
                <ListFilter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="flex flex-col gap-1">
                <FilterOption
                  active={filterStatus === 'all'}
                  onClick={() => onFilterStatusChange('all')}
                  label={t('knowledge.chunks.toolbar.filterAll')}
                  count={total}
                />
                <FilterOption
                  active={filterStatus === 'enabled'}
                  onClick={() => onFilterStatusChange('enabled')}
                  label={t('knowledge.chunks.toolbar.filterEnabled')}
                  tone="success"
                />
                <FilterOption
                  active={filterStatus === 'disabled'}
                  onClick={() => onFilterStatusChange('disabled')}
                  label={t('knowledge.chunks.toolbar.filterDisabled')}
                  tone="error"
                />
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip content={t('knowledge.chunks.toolbar.addChunk')}>
            <Button variant="ghost" size="sm" onClick={onAddChunk}>
              <Plus className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-8 border-t border-border-subtle py-2">
        <div className="flex cursor-pointer items-center gap-2 text-text-secondary hover:text-text-primary">
          <Checkbox
            id="select-all-chunks"
            checked={isAllSelected}
            indeterminate={isPartialSelected}
            onCheckedChange={onSelectAll}
          />
          <Label htmlFor="select-all-chunks" className="cursor-pointer text-sm">
            {t('knowledge.chunks.toolbar.selectAll')}
          </Label>
          {hasSelected && (
            <span className="ml-1 text-xs text-text-tertiary">
              ({selectedCount})
            </span>
          )}
        </div>

        {hasSelected && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkEnable}
              disabled={isBulkSwitchPending}
              className="gap-1 text-text-secondary hover:text-text-primary"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{t('knowledge.chunks.toolbar.enable')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDisable}
              disabled={isBulkSwitchPending}
              className="gap-1 text-text-secondary hover:text-text-primary"
            >
              <Ban className="h-4 w-4" />
              <span>{t('knowledge.chunks.toolbar.disable')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDeleteClick}
              disabled={isDeletePending}
              className="hover:text-text-error/80 gap-1 text-text-error"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t('knowledge.chunks.toolbar.delete')}</span>
            </Button>
          </>
        )}

        <div className="ml-auto text-sm text-text-tertiary">
          {t('knowledge.chunks.toolbar.totalChunks', { count: total })}
          {searchKeyword.trim() && (
            <span className="ml-2 text-text-accent">
              {t('knowledge.chunks.toolbar.searchSummary', {
                keyword: searchKeyword.trim(),
              })}
            </span>
          )}
          {filterStatus !== 'all' && (
            <span className="ml-2 text-text-accent">
              {t('knowledge.chunks.toolbar.filterSummary', {
                status: filterLabel,
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface FilterOptionProps {
  active: boolean
  onClick: () => void
  label: string
  count?: number
  tone?: 'success' | 'error'
}

const FilterOption = ({
  active,
  onClick,
  label,
  count,
  tone,
}: FilterOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
      active
        ? 'bg-state-active text-text-primary'
        : 'text-text-secondary hover:bg-state-hover',
    )}
  >
    {tone && (
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          tone === 'success' ? 'bg-status-success' : 'bg-status-error',
        )}
      />
    )}
    <span className="flex-1">{label}</span>
    {count !== undefined && (
      <span className="text-xs text-text-tertiary">{count}</span>
    )}
  </button>
)
