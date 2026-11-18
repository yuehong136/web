/**
 * Document bulk actions on the shared floating BulkActionBar: enable,
 * disable, parse, stop and (last) delete.
 */

import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Play, Square, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { BulkActionBar } from '@/components/patterns'

interface BulkActionToolbarProps {
  selectedCount: number
  onEnable: () => void
  onDisable: () => void
  onStartParse: () => void
  onStopParse: () => void
  onDelete: () => void
  onClearSelection: () => void
  isLoading?: boolean
}

export const BulkActionToolbar: FC<BulkActionToolbarProps> = ({
  selectedCount,
  onEnable,
  onDisable,
  onStartParse,
  onStopParse,
  onDelete,
  onClearSelection,
  isLoading = false,
}) => {
  const { t } = useTranslation()
  const actions = [
    { key: 'startParse', icon: Play, onClick: onStartParse },
    { key: 'stopTask', icon: Square, onClick: onStopParse },
    { key: 'enable', icon: CheckCircle, onClick: onEnable },
    { key: 'disable', icon: XCircle, onClick: onDisable },
  ] as const

  return (
    <BulkActionBar
      count={selectedCount}
      onClear={onClearSelection}
      // One line (shrink-to-fit beside `left-1/2` would wrap), above the pager.
      className="bottom-[calc(var(--control-height)+var(--space-md))] w-max"
      label={t('knowledge.documents.bulkActions.selected', {
        count: selectedCount,
      })}
    >
      {actions.map(({ key, icon: Icon, onClick }) => (
        <Button
          key={key}
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={isLoading}
        >
          <Icon className="size-icon-sm" aria-hidden="true" />
          {t(`knowledge.documents.bulkActions.${key}`)}
        </Button>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-danger-fg"
        onClick={onDelete}
        disabled={isLoading}
      >
        <Trash2 className="size-icon-sm" aria-hidden="true" />
        {t('knowledge.documents.bulkActions.delete')}
      </Button>
    </BulkActionBar>
  )
}
