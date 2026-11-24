import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { memoryAPI } from '@/api/memory'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { memoryOperationReady } from '@/lib/memory-operation'
import type { MemoryOperation } from '@/types/memory-revisions'
import { MemoryExecutionStatus } from './memory-execution-status'
import { MemoryCompactionRecoveryLink } from './memory-compaction-recovery-link'
import {
  memoryCommandErrorKey,
  useMemoryCommand,
  useMemoryOperation,
} from '@/hooks/use-memory-revisions'

export function MemoryOperationPanel({
  memoryId,
  operationId,
  onRefresh,
  onStatus,
  poll = false,
}: {
  memoryId: string
  operationId: string
  onRefresh: () => void
  onStatus?: (operation: MemoryOperation) => void
  poll?: boolean
}) {
  const { t } = useTranslation()
  const query = useMemoryOperation(memoryId, operationId, poll)
  const reconcile = useMemoryCommand(memoryId, () =>
    memoryAPI.revision.reconcile(memoryId, operationId),
  )
  const deletion = query.data?.kind === 'delete_memory'
  const append = query.data?.kind === 'append_raw'
  const analysis = query.data?.kind === 'dream_analyze'
  const unknown =
    query.data?.status === 'persistence_unknown' ||
    query.data?.index_sync_status === 'unknown'
  const canReconcile =
    query.data?.can_reconcile ?? (!analysis && query.data?.retryable)
  const ready = memoryOperationReady(query.data)
  useEffect(() => {
    if (query.data) onStatus?.(query.data)
  }, [query.data, onStatus])
  if (query.data?.kind === 'context_compact')
    return (
      <MemoryCompactionRecoveryLink
        memoryId={memoryId}
        operationId={operationId}
        value={query.data}
        pending={query.isFetching}
        onRefresh={() => {
          void query.refetch()
          onRefresh()
        }}
      />
    )
  return (
    <section
      className="space-y-space-sm rounded-radius-lg border border-line p-space-base"
      aria-live="polite"
    >
      <h3 className="text-sm font-medium">{t('memory.revisions.operation')}</h3>
      <p className="font-mono text-xs break-all">{operationId}</p>
      <Alert
        variant={
          ready
            ? 'success'
            : append && query.data?.queue_state === 'unknown'
              ? 'warning'
              : 'info'
        }
      >
        {t(
          deletion
            ? ready
              ? 'memory.deletion.completed'
              : 'memory.deletion.pending'
            : analysis
              ? ready
                ? 'memory.dreaming.analysisReady'
                : 'memory.recovery.analysisPending'
              : append
                ? ready
                  ? 'memory.writers.rawPublished'
                  : query.data?.index_sync_status === 'ready'
                    ? 'memory.writers.queueUnconfirmed'
                    : 'memory.writers.appendPending'
                : ready
                  ? 'memory.revisions.ready'
                  : 'memory.revisions.pending',
        )}
      </Alert>
      <MemoryExecutionStatus execution={query.data?.execution} />
      {unknown && (
        <Alert variant="warning">{t('memory.recovery.unknown')}</Alert>
      )}
      {query.data && (
        <dl className="grid grid-cols-2 gap-space-sm text-xs">
          <dt>{t('memory.revisions.publication')}</dt>
          <dd>{query.data.status}</dd>
          <dt>{t('memory.revisions.indexSync')}</dt>
          <dd>{query.data.index_sync_status}</dd>
          {append && (
            <>
              <dt>{t('memory.writers.queueState')}</dt>
              <dd>{query.data.queue_state ?? 'unknown'}</dd>
              {query.data.raw_source_id && (
                <>
                  <dt>{t('memory.writers.rawSource')}</dt>
                  <dd className="font-mono break-all">
                    {query.data.raw_source_id}
                  </dd>
                </>
              )}
              {query.data.extraction_task_id && (
                <>
                  <dt>{t('memory.writers.extractionTask')}</dt>
                  <dd className="font-mono break-all">
                    {query.data.extraction_task_id}
                  </dd>
                </>
              )}
            </>
          )}
          {query.data.lifecycle && (
            <>
              <dt>{t('memory.deletion.lifecycle')}</dt>
              <dd>{query.data.lifecycle}</dd>
            </>
          )}
          {query.data.writer_drain &&
            Object.entries(query.data.writer_drain).map(([key, count]) => (
              <div key={key} className="contents">
                <dt>{t(`memory.deletion.drain.${key}`)}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          {query.data.tracked_cleanup_confirmed !== undefined && (
            <>
              <dt>{t('memory.revisions.trackedCleanup')}</dt>
              <dd>
                {t(
                  query.data.tracked_cleanup_confirmed
                    ? 'memory.revisions.complete'
                    : 'memory.deletion.notConfirmed',
                )}
              </dd>
            </>
          )}
          {query.data.stop_supply && (
            <>
              <dt>{t('memory.revisions.supply')}</dt>
              <dd>{query.data.stop_supply}</dd>
            </>
          )}
          {query.data.projection_cleanup_status && (
            <>
              <dt>{t('memory.revisions.trackedCleanup')}</dt>
              <dd>{query.data.projection_cleanup_status}</dd>
            </>
          )}
          {query.data.physical_cleanup_complete !== undefined && (
            <>
              <dt>{t('memory.revisions.cleanup')}</dt>
              <dd>
                {t(
                  query.data.physical_cleanup_complete
                    ? 'memory.revisions.complete'
                    : 'memory.revisions.notCertified',
                )}
              </dd>
            </>
          )}
        </dl>
      )}
      {append && (
        <p className="text-xs text-fg-muted">
          {t(
            query.data?.queue_state === 'not_required'
              ? 'memory.writers.noExtraction'
              : 'memory.writers.extractionBoundary',
          )}
        </p>
      )}
      {query.data?.untraceable_copies && (
        <p className="text-xs text-fg-muted">
          {t('memory.revisions.retainedCopies')}
        </p>
      )}
      {!!query.data?.blocked_by?.length && (
        <p className="text-xs text-fg-muted">
          {t('memory.deletion.blockedBy')}: {query.data.blocked_by.join(', ')}
        </p>
      )}
      {query.data?.needs_operator_reconciliation && (
        <Alert variant="warning">
          {t(
            deletion
              ? 'memory.deletion.operatorRequired'
              : 'memory.recovery.operatorRequired',
          )}
        </Alert>
      )}
      {(query.isError || reconcile.isError) && (
        <p role="alert" className="text-sm text-danger-fg">
          {t(
            reconcile.isError
              ? memoryCommandErrorKey(reconcile.error)
              : 'memory.revisions.statusFailed',
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-space-sm">
        <Button
          size="sm"
          variant="outline"
          disabled={query.isFetching || reconcile.isPending}
          onClick={async () => {
            await query.refetch()
            onRefresh()
          }}
        >
          {t('memory.revisions.refreshStatus')}
        </Button>
        {canReconcile &&
          !query.data?.writer_busy &&
          !query.data?.needs_operator_reconciliation &&
          !query.data?.execution?.needs_operator_reconciliation &&
          !ready && (
            <Button
              size="sm"
              variant="outline"
              disabled={reconcile.isPending}
              onClick={async () => {
                try {
                  await reconcile.mutateAsync(undefined)
                  onRefresh()
                } catch {
                  /* Fixed local feedback above. */
                }
              }}
            >
              {t('memory.revisions.reconcile')}
            </Button>
          )}
      </div>
    </section>
  )
}
