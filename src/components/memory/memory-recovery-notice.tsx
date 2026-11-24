import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMemoryOperationInbox } from '@/hooks/use-memory-operation-inbox'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

/** Discovery only: this notice never submits or reconciles an operation. */
export function MemoryRecoveryNotice({ memoryId }: { memoryId: string }) {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const location = useLocation()
  const inbox = useMemoryOperationInbox(memoryId)
  const operationId =
    params.get('operation') || inbox.data?.operations[0]?.operation_id
  const target = `/memory/${encodeURIComponent(memoryId)}/operations${operationId ? `?${new URLSearchParams({ operation: operationId })}` : ''}`
  if (
    (params.get('operation') && !location.pathname.endsWith('/maintenance')) ||
    (inbox.data && inbox.data.memory_state !== 'active')
  )
    return <Navigate replace to={target} />
  if (!inbox.data?.operations.length || inbox.isError) return null
  return (
    <Alert
      variant="info"
      className="m-space-sm flex shrink-0 flex-wrap items-center justify-between gap-space-sm text-sm"
    >
      <span>{t('memory.recovery.pendingFound')}</span>
      <Button asChild variant="outline" size="sm">
        <Link to={target}>{t('memory.recovery.openPending')}</Link>
      </Button>
    </Alert>
  )
}
