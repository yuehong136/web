import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useDeleteDocument,
  useDownloadDocument,
  useRenameDocument,
} from '@/hooks/use-document-request'
import { toast } from '@/lib/toast'
import type { Document } from '@/types/api'
import { useDocumentStatusActions } from './use-document-status-actions'
import { useDocumentIngestActions } from './use-document-ingest-actions'

export function useDocumentActions(
  onSuccess?: () => void,
  datasetId?: string,
  onBulkStatus?: (succeededIds: string[]) => void,
) {
  const { t } = useTranslation()
  const ingestActions = useDocumentIngestActions(datasetId, onBulkStatus)
  const statusActions = useDocumentStatusActions(datasetId, onBulkStatus)
  const { renameDocument, isLoading: isRenaming } = useRenameDocument()
  // TODO(2026-08-01): datasetId 可选是兼容期设计（见 api/knowledge-rest.ts），
  // 后端全部升级后收紧为必填。
  const { deleteDocument, isLoading: isDeleting } = useDeleteDocument(datasetId)
  const { downloadDocument, isLoading: isDownloading } = useDownloadDocument()

  const handleRename = useCallback(
    async (docId: string, newName: string) => {
      try {
        await renameDocument({ docId, name: newName })
        toast.success(t('knowledge.documents.toasts.renameSuccess'))
        onSuccess?.()
      } catch {
        toast.error(t('knowledge.documents.toasts.renameError'))
      }
    },
    [renameDocument, onSuccess, t],
  )

  const handleDownload = useCallback(
    async (doc: Document) => {
      try {
        await downloadDocument({ docId: doc.id, filename: doc.name })
      } catch {
        toast.error(t('knowledge.documents.toasts.downloadError'))
      }
    },
    [downloadDocument, t],
  )

  const handleDelete = useCallback(
    async (docIds: string[]) => {
      try {
        await deleteDocument(docIds)
        toast.success(
          t('knowledge.documents.toasts.deleteSuccess', {
            count: docIds.length,
          }),
        )
        onSuccess?.()
      } catch {
        toast.error(t('knowledge.documents.toasts.deleteError'))
      }
    },
    [deleteDocument, onSuccess, t],
  )

  return {
    ...statusActions,
    ...ingestActions,
    handleRename,
    handleDownload,
    handleDelete,
    isRenaming,
    isDeleting,
    isDownloading,
  }
}
