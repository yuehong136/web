import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { memoryAPI } from '@/api/memory'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { confirmedMemoryDeletion } from '@/hooks/memory-deletion-cache'
import type { MemoryOperation } from '@/types/memory-revisions'
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
}: {
  memoryId: string
  operationId: string
  onRefresh: () => void
  onStatus?: (operation: MemoryOperation) => void
}) {
  const { t } = useTranslation()
  const query = useMemoryOperation(memoryId, operationId)
  const reconcile = useMemoryCommand(memoryId, () =>
    memoryAPI.revision.reconcile(memoryId, operationId),
  )
  const deletion = query.data?.kind === 'delete_memory'
  const ready = deletion
    ? confirmedMemoryDeletion(query.data)
    : query.data?.index_sync_status === 'ready'
  useEffect(() => {
    if (query.data) onStatus?.(query.data)
  }, [query.data, onStatus])
  return (
    <section
      className="space-y-space-sm rounded-radius-lg border border-border-default p-space-base"
      aria-live="polite"
    >
      <h3 className="text-sm font-medium">{t('memory.revisions.operation')}</h3>
      <p className="font-mono text-xs break-all">{operationId}</p>
      <Alert variant={ready ? 'success' : 'info'}>
        {t(
          deletion
            ? ready
              ? 'memory.deletion.completed'
              : 'memory.deletion.pending'
            : ready
              ? 'memory.revisions.ready'
              : 'memory.revisions.pending',
        )}
      </Alert>
      {query.data && (
        <dl className="grid grid-cols-2 gap-space-sm text-xs">
          <dt>{t('memory.revisions.publication')}</dt>
          <dd>{query.data.status}</dd>
          <dt>{t('memory.revisions.indexSync')}</dt>
          <dd>{query.data.index_sync_status}</dd>
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
      {query.data?.untraceable_copies && (
        <p className="text-xs text-text-secondary">
          {t('memory.revisions.retainedCopies')}
        </p>
      )}
      {!!query.data?.blocked_by?.length && (
        <p className="text-xs text-text-secondary">
          {t('memory.deletion.blockedBy')}: {query.data.blocked_by.join(', ')}
        </p>
      )}
      {query.data?.needs_operator_reconciliation && (
        <Alert variant="warning">{t('memory.deletion.operatorRequired')}</Alert>
      )}
      {(query.isError || reconcile.isError) && (
        <p role="alert" className="text-sm text-status-error">
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
        {query.data?.retryable && !ready && (
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
