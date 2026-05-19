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
}: ChunkDeleteConfirmsProps) => {
  const { t } = useTranslation()

  return (
    <>
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={onDeleteConfirmClose}
        onConfirm={onDeleteConfirm}
        title={t('knowledge.chunks.modal.deleteTitle')}
        description={t('knowledge.chunks.modal.deleteDescription', {
          id: deletingChunkId,
        })}
      />

      <ConfirmModal
        open={deleteSelectedConfirmOpen}
        onClose={onDeleteSelectedConfirmClose}
        onConfirm={onDeleteSelectedConfirm}
        title={t('knowledge.chunks.modal.bulkDeleteTitle')}
        description={t('knowledge.chunks.modal.bulkDeleteDescription', {
          count: selectedChunkCount,
        })}
      />
    </>
  )
}
