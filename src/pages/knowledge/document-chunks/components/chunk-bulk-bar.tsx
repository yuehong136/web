import { Ban, CheckCircle, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { BulkActionBar } from '@/components/patterns'

interface ChunkBulkBarProps {
  selectedCount: number
  onBulkEnable: () => void
  onBulkDisable: () => void
  /** Opens the delete confirmation. */
  onBulkDeleteClick: () => void
  onClearSelection: () => void
  disabled?: boolean
}

/** Floating actions for the selected chunks; hidden with no selection. */
export function ChunkBulkBar({
  selectedCount,
  onBulkEnable,
  onBulkDisable,
  onBulkDeleteClick,
  onClearSelection,
  disabled = false,
}: ChunkBulkBarProps) {
  const { t } = useTranslation()
  return (
    <BulkActionBar
      count={selectedCount}
      onClear={onClearSelection}
      // One line (shrink-to-fit beside `left-1/2` would wrap), above the pager.
      className="bottom-[calc(var(--control-height)+var(--space-md))] w-max"
      label={t('knowledge.chunks.toolbar.selectedChunks', {
        count: selectedCount,
      })}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onBulkEnable}
        disabled={disabled}
      >
        <CheckCircle className="size-icon-sm" aria-hidden="true" />
        {t('knowledge.chunks.toolbar.enable')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBulkDisable}
        disabled={disabled}
      >
        <Ban className="size-icon-sm" aria-hidden="true" />
        {t('knowledge.chunks.toolbar.disable')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBulkDeleteClick}
        disabled={disabled}
        className="text-danger-fg"
      >
        <Trash2 className="size-icon-sm" aria-hidden="true" />
        {t('knowledge.chunks.toolbar.delete')}
      </Button>
    </BulkActionBar>
  )
}
