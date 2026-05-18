import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useChangeDocumentStatus,
  useDeleteDocument,
  useDownloadDocument,
  useRenameDocument,
  useRunDocument,
} from '@/hooks/use-document-request'
import { toast } from '@/lib/toast'
import type { Document } from '@/types/api'

const getMutationCounts = (result: Record<string, { error?: string }>) => {
  let successCount = 0
  let errorCount = 0

  Object.values(result).forEach((res) => {
    if (res.error) {
      errorCount += 1
    } else {
      successCount += 1
    }
  })

  return { successCount, errorCount }
}

export function useDocumentActions(onSuccess?: () => void) {
  const { t } = useTranslation()
  const { runDocument, isLoading: isRunning } = useRunDocument()
  const { changeStatus, isLoading: isChangingStatus } =
    useChangeDocumentStatus()
  const { renameDocument, isLoading: isRenaming } = useRenameDocument()
  const { deleteDocument, isLoading: isDeleting } = useDeleteDocument()
  const { downloadDocument, isLoading: isDownloading } = useDownloadDocument()

  const handleStartParse = useCallback(
    async (docIds: string[], deleteHistory = false) => {
      try {
        await runDocument({ docIds, run: 1, deleteHistory })
        toast.success(
          t('knowledge.documents.toasts.parseStarted', {
            count: docIds.length,
          }),
        )
        onSuccess?.()
      } catch (error) {
        console.error('Failed to start parsing:', error)
        toast.error(t('knowledge.documents.toasts.parseStartError'))
      }
    },
    [runDocument, onSuccess, t],
  )

  const handleStopParse = useCallback(
    async (docIds: string[]) => {
      try {
        await runDocument({ docIds, run: 2 })
        toast.success(
          t('knowledge.documents.toasts.parseStopped', {
            count: docIds.length,
          }),
        )
        onSuccess?.()
      } catch (error) {
        console.error('Failed to stop parsing:', error)
        toast.error(t('knowledge.documents.toasts.parseStopError'))
      }
    },
    [runDocument, onSuccess, t],
  )

  const handleToggleStatus = useCallback(
    async (doc: Document) => {
      const newStatus = doc.status === '1' ? 0 : 1
      try {
        const result = await changeStatus({
          docIds: [doc.id],
          status: newStatus as 0 | 1,
        })
        const docResult = result[doc.id]
        if (docResult?.error) {
          toast.error(
            t('knowledge.documents.toasts.statusToggleDetailError', {
              error: docResult.error,
            }),
          )
          return
        }
        toast.success(
          t(
            newStatus === 1
              ? 'knowledge.documents.toasts.documentEnabled'
              : 'knowledge.documents.toasts.documentDisabled',
          ),
        )
        onSuccess?.()
      } catch (error) {
        console.error('Failed to toggle document status:', error)
        toast.error(t('knowledge.documents.toasts.statusToggleError'))
      }
    },
    [changeStatus, onSuccess, t],
  )

  const handleBulkEnable = useCallback(
    async (docIds: string[]) => {
      try {
        const result = await changeStatus({ docIds, status: 1 })
        const { successCount, errorCount } = getMutationCounts(result)
        if (errorCount > 0) {
          toast.warning(
            t('knowledge.documents.toasts.bulkEnablePartial', {
              successCount,
              errorCount,
            }),
          )
        } else {
          toast.success(
            t('knowledge.documents.toasts.bulkEnableSuccess', {
              count: successCount,
            }),
          )
        }
        onSuccess?.()
      } catch (error) {
        console.error('Failed to enable documents:', error)
        toast.error(t('knowledge.documents.toasts.bulkEnableError'))
      }
    },
    [changeStatus, onSuccess, t],
  )

  const handleBulkDisable = useCallback(
    async (docIds: string[]) => {
      try {
        const result = await changeStatus({ docIds, status: 0 })
        const { successCount, errorCount } = getMutationCounts(result)
        if (errorCount > 0) {
          toast.warning(
            t('knowledge.documents.toasts.bulkDisablePartial', {
              successCount,
              errorCount,
            }),
          )
        } else {
          toast.success(
            t('knowledge.documents.toasts.bulkDisableSuccess', {
              count: successCount,
            }),
          )
        }
        onSuccess?.()
      } catch (error) {
        console.error('Failed to disable documents:', error)
        toast.error(t('knowledge.documents.toasts.bulkDisableError'))
      }
    },
    [changeStatus, onSuccess, t],
  )

  const handleRename = useCallback(
    async (docId: string, newName: string) => {
      try {
        await renameDocument({ docId, name: newName })
        toast.success(t('knowledge.documents.toasts.renameSuccess'))
        onSuccess?.()
      } catch (error) {
        console.error('Failed to rename document:', error)
        toast.error(t('knowledge.documents.toasts.renameError'))
      }
    },
    [renameDocument, onSuccess, t],
  )

  const handleDownload = useCallback(
    async (doc: Document) => {
      try {
        await downloadDocument({ docId: doc.id, filename: doc.name })
      } catch (error) {
        console.error('Failed to download document:', error)
        const msg =
          error instanceof Error
            ? error.message
            : t('knowledge.documents.toasts.downloadError')
        toast.error(msg)
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
      } catch (error) {
        console.error('Failed to delete documents:', error)
        toast.error(t('knowledge.documents.toasts.deleteError'))
      }
    },
    [deleteDocument, onSuccess, t],
  )

  return {
    handleStartParse,
    handleStopParse,
    handleToggleStatus,
    handleRename,
    handleDownload,
    handleDelete,
    handleBulkEnable,
    handleBulkDisable,
    isRunning,
    isChangingStatus,
    isRenaming,
    isDeleting,
    isDownloading,
  }
}
