import { useCallback, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  captureDocumentOperation,
  type ReparseOptions,
} from '@/api/knowledge-document-ingest'
import { useRunDocument } from '@/hooks/use-document-request'
import { toast } from '@/lib/toast'
import { getDocumentOperationOutcome } from '../utils/ingest-result'

export function useDocumentIngestActions(
  datasetId: string | undefined,
  onConfirmed?: (ids: string[]) => void,
) {
  const { t } = useTranslation()
  const { runDocument, isLoading: isRunning } = useRunDocument(datasetId ?? '')
  const ownerRef = useRef({ active: false, busy: false })
  useLayoutEffect(() => {
    const owner = { active: true, busy: false }
    ownerRef.current = owner
    return () => {
      owner.active = false
    }
  }, [datasetId])

  const submit = useCallback(
    async (docIds: string[], run: 1 | 2, reparseOptions?: ReparseOptions) => {
      const owner = ownerRef.current
      if (!owner.active || owner.busy) return null
      owner.busy = true
      const request = {
        datasetId: datasetId ?? '',
        docIds: [...new Set(docIds)],
        run,
        reparseOptions,
      }
      let accepted = false
      let failure: unknown
      try {
        const captured = captureDocumentOperation(
          request.datasetId,
          request.docIds,
          run,
          reparseOptions,
        )
        request.docIds = captured.docIds
        request.reparseOptions = captured.reparseOptions
        await runDocument(captured)
        accepted = true
      } catch (error) {
        failure = error
      } finally {
        owner.busy = false
      }
      if (!owner.active) return null
      const outcome = getDocumentOperationOutcome(request, accepted, failure)
      const prefix = 'knowledge.documents.toasts.'
      if (outcome.complete) {
        toast.success(
          t(`${prefix}${run === 1 ? 'parseStarted' : 'parseStopped'}`, {
            count: outcome.succeededIds.length,
          }),
        )
      } else {
        toast.warning(
          t(`${prefix}${run === 1 ? 'parsePartial' : 'stopPartial'}`, {
            successCount: outcome.succeededIds.length,
            errorCount: outcome.failedIds.length,
          }),
        )
      }
      onConfirmed?.(outcome.succeededIds)
      return outcome
    },
    [datasetId, runDocument, onConfirmed, t],
  )

  return {
    handleStartParse: useCallback(
      (ids: string[], options?: ReparseOptions) => submit(ids, 1, options),
      [submit],
    ),
    handleStopParse: useCallback((ids: string[]) => submit(ids, 2), [submit]),
    isRunning,
    isOperationBusy: () => ownerRef.current.busy,
  }
}
