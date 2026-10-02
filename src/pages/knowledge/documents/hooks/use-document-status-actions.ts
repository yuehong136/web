import { useCallback, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { APIError } from '@/api/client'
import {
  captureDocumentStatusRequest,
  type DocumentEnableStatus,
} from '@/api/knowledge-document-status'
import { useChangeDocumentStatus } from '@/hooks/use-document-request'
import { toast } from '@/lib/toast'
import type { Document } from '@/types/api'
import { getDocumentStatusOutcome } from '../utils/status-result'

export function useDocumentStatusActions(
  datasetId: string | undefined,
  onBulkStatus?: (succeededIds: string[]) => void,
) {
  const { t } = useTranslation()
  const { changeStatus, isLoading: isChangingStatus } =
    useChangeDocumentStatus()
  const ownerRef = useRef({ active: false })
  useLayoutEffect(() => {
    const owner = { active: true }
    ownerRef.current = owner
    return () => {
      owner.active = false
    }
  }, [datasetId])

  const change = useCallback(
    async (docIds: string[], status: DocumentEnableStatus, bulk: boolean) => {
      const owner = ownerRef.current
      let response: unknown
      let accepted = false
      const request = {
        datasetId: datasetId ?? '',
        docIds: [...new Set(docIds)],
        status,
      }
      try {
        const captured = captureDocumentStatusRequest(
          request.datasetId,
          request.docIds,
          status,
        )
        response = await changeStatus(captured)
        accepted = true
      } catch (error) {
        response =
          error instanceof APIError &&
          error.status === 200 &&
          error.code === '500'
            ? error.details
            : undefined
      }
      if (!owner.active) return
      const outcome = getDocumentStatusOutcome(request, response, accepted)
      const prefix = 'knowledge.documents.toasts.'
      if (bulk) {
        const operation = status === 1 ? 'bulkEnable' : 'bulkDisable'
        if (outcome.complete) {
          toast.success(
            t(`${prefix}${operation}Success`, {
              count: outcome.succeededIds.length,
            }),
          )
        } else {
          toast.warning(
            t(`${prefix}${operation}Partial`, {
              successCount: outcome.succeededIds.length,
              errorCount: outcome.failedIds.length,
            }),
          )
        }
        onBulkStatus?.(outcome.succeededIds)
      } else if (outcome.complete) {
        toast.success(
          t(
            `${prefix}${status === 1 ? 'documentEnabled' : 'documentDisabled'}`,
          ),
        )
      } else {
        toast.error(t(`${prefix}statusToggleError`))
      }
    },
    [datasetId, changeStatus, onBulkStatus, t],
  )

  return {
    handleToggleStatus: useCallback(
      (doc: Document) => change([doc.id], doc.status === '1' ? 0 : 1, false),
      [change],
    ),
    handleBulkEnable: useCallback(
      (ids: string[]) => change(ids, 1, true),
      [change],
    ),
    handleBulkDisable: useCallback(
      (ids: string[]) => change(ids, 0, true),
      [change],
    ),
    isChangingStatus,
  }
}
