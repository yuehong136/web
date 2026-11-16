import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ChunkDeleteConfirmsProps {
  deleteConfirmOpen: boolean
  onDeleteConfirmClose: () => void
  onDeleteConfirm: () => void
  deletingChunkId: string
  deleteSelectedConfirmOpen: boolean
  onDeleteSelectedConfirmClose: () => void
  onDeleteSelectedConfirm: () => void
  selectedChunkCount: number
  isPending?: boolean
}

export const ChunkDeleteConfirms = ({
  deleteConfirmOpen,
  onDeleteConfirmClose,
  onDeleteConfirm,
  deletingChunkId,
  deleteSelectedConfirmOpen,
  onDeleteSelectedConfirmClose,
  onDeleteSelectedConfirm,
  selectedChunkCount,
  isPending = false,
}: ChunkDeleteConfirmsProps) => {
  const { t } = useTranslation()

  return (
    <>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(next) => {
          if (!next && !isPending) onDeleteConfirmClose()
        }}
        onConfirm={onDeleteConfirm}
        pending={isPending}
        variant="destructive"
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        title={t('knowledge.chunks.modal.deleteTitle')}
        description={t('knowledge.chunks.modal.deleteDescription', {
          id: deletingChunkId,
        })}
      />

      <ConfirmDialog
        open={deleteSelectedConfirmOpen}
        onOpenChange={(next) => {
          if (!next && !isPending) onDeleteSelectedConfirmClose()
        }}
        onConfirm={onDeleteSelectedConfirm}
        pending={isPending}
        variant="destructive"
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        title={t('knowledge.chunks.modal.bulkDeleteTitle')}
        description={t('knowledge.chunks.modal.bulkDeleteDescription', {
          count: selectedChunkCount,
        })}
      />
    </>
  )
}
