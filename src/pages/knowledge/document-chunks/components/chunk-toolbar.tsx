import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Input } from '@/components/ui'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { ChunkTagsPopover } from './chunk-tags-popover'
import type { ChunkFilterStatus, TextMode } from '../types'

interface ChunkToolbarProps {
  knowledgeIds?: string[]
  textMode: TextMode
  onTextModeChange: (mode: TextMode) => void
  searchKeyword: string
  onSearchKeywordChange: (keyword: string) => void
  filterStatus: ChunkFilterStatus
  onFilterStatusChange: (status: ChunkFilterStatus) => void
  /** Chunks matching the current search and filter. */
  total: number
  /** Every chunk of the document, shown on "All". */
  documentTotal?: number
  isAllSelected: boolean
  isPartialSelected: boolean
  onSelectAll: (checked: boolean) => void
  disabled?: boolean
  isRefreshing?: boolean
}

function StatusLabel({ label, count }: { label: string; count?: number }) {
  return (
    <>
      {label}
      {count === undefined ? null : (
        <span className="ml-space-xs text-xs text-fg-subtle tabular-nums">
          {count.toLocaleString()}
        </span>
      )}
    </>
  )
}

/**
 * One row of chunk controls: select the page, search, the enabled filter
 * (with the counts the API returns), dataset tags and the text display.
 * Bulk actions float over the list in `ChunkBulkBar`.
 */
export const ChunkToolbar = ({
  knowledgeIds,
  textMode,
  onTextModeChange,
  searchKeyword,
  onSearchKeywordChange,
  filterStatus,
  onFilterStatusChange,
  total,
  documentTotal,
  isAllSelected,
  isPartialSelected,
  onSelectAll,
  disabled = false,
  isRefreshing = false,
}: ChunkToolbarProps) => {
  const { t } = useTranslation()
  const searching = searchKeyword.trim() !== ''
  // The list API counts the active filter only; "All" uses the document's.
  const countFor = (status: ChunkFilterStatus) =>
    status === 'all'
      ? (documentTotal ??
        (filterStatus === 'all' && !searching ? total : undefined))
      : filterStatus === status && !searching
        ? total
        : undefined
  const statusOptions = (
    [
      ['all', t('knowledge.chunks.toolbar.filterAll')],
      ['enabled', t('knowledge.chunks.toolbar.filterEnabled')],
      ['disabled', t('knowledge.chunks.toolbar.filterDisabled')],
    ] as const
  ).map(([value, label]) => ({
    value,
    label: <StatusLabel label={label} count={countFor(value)} />,
  }))

  return (
    <div
      data-slot="chunk-toolbar"
      className="flex shrink-0 flex-wrap items-center gap-space-sm px-space-md py-space-sm"
    >
      <Checkbox
        checked={isAllSelected}
        indeterminate={isPartialSelected}
        onCheckedChange={(checked) => onSelectAll(checked === true)}
        disabled={disabled || total === 0}
        aria-label={t('knowledge.chunks.toolbar.selectPage')}
      />
      <div className="relative w-full max-w-72 min-w-40 flex-1">
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
          className="pr-space-xl text-sm"
          inputSize="sm"
        />
        {searchKeyword && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-0 right-0"
            onClick={() => onSearchKeywordChange('')}
            aria-label={t('knowledge.chunks.toolbar.clearSearch')}
          >
            <X className="size-icon-sm" />
          </Button>
        )}
      </div>
      <SegmentedControl
        size="sm"
        aria-label={t('knowledge.chunks.toolbar.statusFilter')}
        value={filterStatus}
        onValueChange={onFilterStatusChange}
        options={statusOptions}
      />
      {knowledgeIds && <ChunkTagsPopover knowledgeIds={knowledgeIds} />}
      {isRefreshing ? (
        <output className="text-xs text-fg-subtle">
          {t('knowledge.chunks.toolbar.updating')}
        </output>
      ) : null}
      <span className="flex-1" aria-hidden="true" />
      <SegmentedControl
        size="sm"
        aria-label={t('knowledge.chunks.toolbar.displayMode')}
        value={textMode}
        onValueChange={onTextModeChange}
        options={[
          { value: 'full', label: t('knowledge.chunks.toolbar.fullText') },
          { value: 'ellipse', label: t('knowledge.chunks.toolbar.ellipsis') },
        ]}
      />
    </div>
  )
}
