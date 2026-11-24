import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { compactionOperationHref } from '@/lib/memory-compaction'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { MemoryOperation } from '@/types/memory-revisions'

export function MemoryCompactionRecoveryLink({
  memoryId,
  operationId,
  value,
  onRefresh,
  pending,
}: {
  memoryId: string
  operationId: string
  value: MemoryOperation
  onRefresh: () => void
  pending: boolean
}) {
  const { t } = useTranslation()
  return (
    <section className="min-w-0 space-y-space-sm rounded-radius-lg border border-line p-space-base">
      <h3 className="text-sm font-medium">
        {t('memory.compaction.operation')}
      </h3>
      <p className="font-mono text-xs break-all">{operationId}</p>
      <Alert variant="info">{t('memory.compaction.recoveryBoundary')}</Alert>
      {value.writer_busy && (
        <Alert variant="warning">{t('memory.compaction.draining')}</Alert>
      )}
      {value.needs_operator_reconciliation && (
        <Alert variant="warning">
          {t('memory.compaction.operatorRequired')}
        </Alert>
      )}
      <div className="flex flex-wrap gap-space-sm">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={onRefresh}
        >
          {t('memory.compaction.refresh')}
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={compactionOperationHref(memoryId, operationId)}>
            {t('memory.compaction.open')}
          </Link>
        </Button>
      </div>
    </section>
  )
}
