import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '@/components/ui'

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
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => {
          if (!isPending) onDeleteConfirmClose()
        }}
        onConfirm={onDeleteConfirm}
        loading={isPending}
        variant="destructive"
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        title={t('knowledge.chunks.modal.deleteTitle')}
        description={t('knowledge.chunks.modal.deleteDescription', {
          id: deletingChunkId,
        })}
      />

      <ConfirmModal
        open={deleteSelectedConfirmOpen}
        onClose={() => {
          if (!isPending) onDeleteSelectedConfirmClose()
        }}
        onConfirm={onDeleteSelectedConfirm}
        loading={isPending}
        variant="destructive"
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        title={t('knowledge.chunks.modal.bulkDeleteTitle')}
        description={t('knowledge.chunks.modal.bulkDeleteDescription', {
          count: selectedChunkCount,
        })}
      />
    </>
  )
}
