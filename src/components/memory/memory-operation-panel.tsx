import { useTranslation } from 'react-i18next'
import { memoryAPI } from '@/api/memory'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  memoryCommandErrorKey,
  useMemoryCommand,
  useMemoryOperation,
} from '@/hooks/use-memory-revisions'

export function MemoryOperationPanel({
  memoryId,
  operationId,
  onRefresh,
}: {
  memoryId: string
  operationId: string
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const query = useMemoryOperation(memoryId, operationId)
  const reconcile = useMemoryCommand(memoryId, () =>
    memoryAPI.revision.reconcile(memoryId, operationId),
  )
  const ready = query.data?.index_sync_status === 'ready'
  return (
    <section
      className="space-y-space-sm rounded-radius-lg border border-border-default p-space-base"
      aria-live="polite"
    >
      <h3 className="text-sm font-medium">{t('memory.revisions.operation')}</h3>
      <p className="font-mono text-xs break-all">{operationId}</p>
      <Alert variant={ready ? 'success' : 'info'}>
        {t(ready ? 'memory.revisions.ready' : 'memory.revisions.pending')}
      </Alert>
      {query.data && (
        <dl className="grid grid-cols-2 gap-space-sm text-xs">
          <dt>{t('memory.revisions.publication')}</dt>
          <dd>{query.data.status}</dd>
          <dt>{t('memory.revisions.indexSync')}</dt>
          <dd>{query.data.index_sync_status}</dd>
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
