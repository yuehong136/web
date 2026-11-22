import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { sourceEntryInputRejected } from '@/lib/memory-source-entry'
import { memoryAPI } from '@/api/memory'
import { useAuthStore } from '@/stores/auth'
import {
  useMemoryCapabilities,
  editableMemoryId,
  memoryCommandErrorKey,
  memoryRevisionKeys,
} from '@/hooks/use-memory-revisions'
import { memoryKeys } from '@/hooks/use-memory'
import { memoryOperationReady } from '@/lib/memory-operation'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { MemorySourceEntryForm } from './memory-source-entry-form'
import { MemoryOperationPanel } from './memory-operation-panel'
import { MemorySourcePanel } from './memory-source-panel'
import type { MemoryOperation } from '@/types/memory-revisions'
import type { MemoryStructuredSourceCommand } from '@/types/memory-sources'
export function MemorySourceEntry({
  memoryId,
  operationIdFactory,
}: {
  memoryId: string
  operationIdFactory?: () => string
}) {
  const actor = useAuthStore((state) => state.token)
  return (
    <SourceEntryOwner
      key={memoryId + ':' + actor}
      memoryId={memoryId}
      operationIdFactory={operationIdFactory}
    />
  )
}
function SourceEntryOwner({
  memoryId,
  operationIdFactory = () => `source-${crypto.randomUUID()}`,
}: {
  memoryId: string
  operationIdFactory?: () => string
}) {
  const { t } = useTranslation(),
    cache = useQueryClient(),
    capability = useMemoryCapabilities(memoryId)
  const [params, setParams] = useSearchParams(),
    operationId = params.get('source_operation') ?? ''
  const [open, setOpen] = useState(!!operationId),
    [operation, setOperation] = useState<MemoryOperation | null>(null),
    [failure, setFailure] = useState<{
      operationId: string
      key: string
      rejectedBeforeAdmission: boolean
    }>()
  const mounted = useRef(false),
    generation = useRef(0),
    admitted = useRef(''),
    body = useRef<MemoryStructuredSourceCommand | null>(null),
    refreshed = useRef(new Set<string>())
  const stop = useCallback(() => {
    generation.current++
    body.current = null
  }, [])
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stop()
    }
  }, [stop])
  const refresh = useCallback(() => {
    if (!mounted.current) return
    void cache.invalidateQueries({ queryKey: memoryKeys.messages(memoryId) })
    void cache.invalidateQueries({
      queryKey: memoryRevisionKeys.capabilities(memoryId),
    })
  }, [cache, memoryId])
  const status = useCallback(
    (value: MemoryOperation) => {
      if (!mounted.current) return
      setOperation((previous) => (previous === value ? previous : value))
      if (
        memoryOperationReady(value) &&
        !refreshed.current.has(value.operation_id)
      ) {
        refreshed.current.add(value.operation_id)
        refresh()
      }
    },
    [refresh],
  )
  const create = useMutation<
    void,
    Error,
    { operationId: string; generation: number }
  >({
    gcTime: 0,
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (ticket) => {
      const command = body.current
      body.current = null
      if (!command || command.operation_id !== ticket.operationId) return
      try {
        const result = await memoryAPI.sources.create(memoryId, command)
        if (!mounted.current || generation.current !== ticket.generation) return
        cache.setQueryData(
          memoryRevisionKeys.operation(memoryId, ticket.operationId),
          result,
        )
      } catch (failure) {
        if (!mounted.current || generation.current !== ticket.generation) return
        setFailure({
          operationId: ticket.operationId,
          key: memoryCommandErrorKey(failure),
          rejectedBeforeAdmission: sourceEntryInputRejected(failure),
        })
      }
    },
  })
  const submit = (
    draft: Omit<MemoryStructuredSourceCommand, 'operation_id' | 'user_id'>,
  ) => {
    if (
      operationId ||
      admitted.current ||
      capability.data?.structured_sources?.supported !== true
    )
      return
    const id = operationIdFactory()
    admitted.current = id
    body.current = { ...draft, user_id: '', operation_id: id }
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('source_operation', id)
      return next
    })
    create.mutate({ operationId: id, generation: generation.current })
  }
  const current = operation?.operation_id === operationId ? operation : null
  const currentFailure = failure?.operationId === operationId ? failure : null
  const ready =
    current?.kind === 'append_raw' &&
    current.queue_state === 'not_required' &&
    !current.extraction_task_id &&
    memoryOperationReady(current)
  const sourceId = ready
    ? editableMemoryId(current.raw_source_id ?? undefined)
    : null
  const startNew = () => {
    generation.current++
    admitted.current = ''
    body.current = null
    setOperation(null)
    setFailure(undefined)
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('source_operation')
      return next
    })
    setOpen(true)
  }
  if (capability.data?.structured_sources?.supported !== true && !operationId)
    return null
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t(
          operationId
            ? 'memory.sourceEntry.resume'
            : 'memory.sourceEntry.title',
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg" modal className="overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('memory.sourceEntry.title')}</DialogTitle>
            <DialogDescription>
              {t('memory.sourceEntry.description')}{' '}
              {t('memory.sourceEntry.closeDraft')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-w-0 px-6 pb-6">
            {operationId ? (
              <div className="min-w-0 space-y-space-base">
                <Alert variant="info">{t('memory.sourceEntry.recovery')}</Alert>
                {currentFailure && (
                  <Alert variant="warning">{t(currentFailure.key)}</Alert>
                )}
                <MemoryOperationPanel
                  key={operationId}
                  memoryId={memoryId}
                  operationId={operationId}
                  poll
                  onRefresh={refresh}
                  onStatus={status}
                />
                {sourceId && (
                  <>
                    <Alert variant="success">
                      {t('memory.sourceEntry.recorded')}
                    </Alert>
                    <p className="font-mono text-xs break-all">{sourceId}</p>
                    <MemorySourcePanel
                      memoryId={memoryId}
                      sourceId={sourceId}
                    />
                    <Button asChild variant="outline">
                      <Link
                        to={`/memory/${encodeURIComponent(memoryId)}/maintenance`}
                      >
                        {t('memory.sourceEntry.prepare')}
                      </Link>
                    </Button>
                  </>
                )}
                {((ready && !!sourceId) ||
                  currentFailure?.rejectedBeforeAdmission ||
                  (current &&
                    ['failed', 'rejected', 'canceled'].includes(
                      current.status,
                    ) &&
                    current.retryable === false &&
                    current.can_reconcile === false &&
                    !['unknown', 'pending'].includes(
                      current.index_sync_status,
                    ) &&
                    !current.writer_busy &&
                    !current.needs_operator_reconciliation)) && (
                  <Button variant="outline" onClick={startNew}>
                    {t('memory.sourceEntry.new')}
                  </Button>
                )}
                <Button asChild variant="ghost">
                  <Link
                    to={`/memory/${encodeURIComponent(memoryId)}/operations?${new URLSearchParams({ operation: operationId })}`}
                  >
                    {t('memory.sourceEntry.operations')}
                  </Link>
                </Button>
              </div>
            ) : capability.data?.structured_sources ? (
              <MemorySourceEntryForm
                capability={capability.data.structured_sources}
                onSubmit={submit}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
