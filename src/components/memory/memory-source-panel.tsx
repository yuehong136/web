import { useId, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useTranslation } from 'react-i18next'
import { memoryAPI } from '@/api/memory'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import {
  editableMemoryId,
  isKnownMemoryRejection,
  memoryCommandErrorKey,
  useMemoryCapabilities,
  useMemoryCommand,
  useMemoryOperation,
  useMemorySourceState,
} from '@/hooks/use-memory-revisions'
import { MemoryAdoptionConfirmation } from './memory-adoption-confirmation'
import { MemoryOperationPanel } from './memory-operation-panel'

export function MemorySourcePanel({
  memoryId,
  sourceId,
}: {
  memoryId: string
  sourceId: string
}) {
  const { t } = useTranslation()
  const controlId = useId()
  const safeId = editableMemoryId(sourceId)
  const capabilities = useMemoryCapabilities(memoryId)
  const supported = capabilities.data?.source_withdrawals?.supported === true
  const source = useMemorySourceState(memoryId, sourceId, !!safeId && supported)
  const [confirmed, setConfirmed] = useState(false)
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false)
  const [reason, setReason] = useState('')
  const [operationId, setOperationId] = useState('')
  const operation = useMemoryOperation(memoryId, operationId)
  const adopt = useMemoryCommand(memoryId, (op: string) =>
    memoryAPI.revision.adoptSource(
      memoryId,
      sourceId,
      op,
      source.data!.content_sha256,
    ),
  )
  const withdraw = useMemoryCommand(memoryId, (op: string) =>
    memoryAPI.revision.withdraw(
      memoryId,
      sourceId,
      op,
      source.data!.source_revision!,
      reason,
    ),
  )
  const busy =
    adopt.isPending ||
    withdraw.isPending ||
    (!!operationId && operation.data?.index_sync_status !== 'ready')
  const refresh = () => {
    void source.refetch()
    void capabilities.refetch()
  }
  if (!safeId)
    return <Alert variant="warning">{t('memory.revisions.unsafeId')}</Alert>
  if (capabilities.isPending) return <PageLoadingState />
  if (capabilities.isError)
    return <PageErrorState onRetry={() => capabilities.refetch()} />
  if (!supported) return null
  if (source.isPending) return <PageLoadingState />
  if (source.isError || !source.data)
    return <PageErrorState onRetry={() => source.refetch()} />
  const state = source.data
  return (
    <section
      aria-label={`${t('memory.revisions.source')} ${sourceId}`}
      className="space-y-space-sm rounded-radius-lg border border-border-subtle p-space-base"
    >
      <h3 className="text-sm font-medium">
        {t('memory.revisions.source')} ·{' '}
        <span className="font-mono">{sourceId}</span>
      </h3>
      <p className="text-xs text-text-secondary">
        {t(
          state.managed
            ? 'memory.revisions.sourceManaged'
            : 'memory.revisions.sourceUnmanaged',
        )}{' '}
        · {state.state}
      </p>
      <details className="text-xs text-text-secondary">
        <summary className="cursor-pointer">
          {t('memory.revisions.scope')}
        </summary>
        <pre className="mt-space-xs break-all whitespace-pre-wrap">
          {JSON.stringify(state.scope, null, 2)}
        </pre>
      </details>
      {!state.managed ? (
        <>
          <MemoryAdoptionConfirmation
            managed={capabilities.data?.revisions?.managed === true}
            checked={confirmed}
            onCheckedChange={setConfirmed}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!confirmed || busy}
            onClick={async () => {
              const op = `memory-${uuid()}`
              setOperationId(op)
              try {
                await adopt.mutateAsync(op)
                refresh()
              } catch (error) {
                if (isKnownMemoryRejection(error)) {
                  setOperationId('')
                  setConfirmed(false)
                }
                refresh()
              }
            }}
          >
            {t('memory.revisions.adoptSource')}
          </Button>
        </>
      ) : ['forgotten', 'deleted', 'withdrawn'].includes(state.state) ? (
        <Alert variant="warning">{t('memory.revisions.withdrawn')}</Alert>
      ) : (
        <>
          <Alert variant="warning">{t('memory.revisions.withdrawScope')}</Alert>
          <div className="space-y-space-xs">
            <Label htmlFor={`${controlId}-reason`}>
              {t('memory.revisions.reason')}
            </Label>
            <Input
              id={`${controlId}-reason`}
              maxLength={2048}
              value={reason}
              disabled={busy}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="flex items-start gap-space-sm text-sm">
            <Checkbox
              id={`${controlId}-confirm`}
              checked={withdrawConfirmed}
              disabled={busy}
              onCheckedChange={(value) => setWithdrawConfirmed(value === true)}
            />
            <Label htmlFor={`${controlId}-confirm`}>
              {t('memory.revisions.withdrawConfirm')}
            </Label>
          </div>
          <Button
            size="sm"
            variant="destructive"
            disabled={
              busy ||
              !withdrawConfirmed ||
              !reason.trim() ||
              state.source_revision === null
            }
            onClick={async () => {
              const op = `memory-${uuid()}`
              setOperationId(op)
              try {
                await withdraw.mutateAsync(op)
                refresh()
              } catch (error) {
                if (isKnownMemoryRejection(error)) {
                  setOperationId('')
                  setWithdrawConfirmed(false)
                }
                refresh()
              }
            }}
          >
            {t('memory.revisions.withdraw')}
          </Button>
        </>
      )}
      {(adopt.isError || withdraw.isError) && (
        <p role="alert" className="text-sm text-status-error">
          {t(memoryCommandErrorKey(withdraw.error ?? adopt.error))}
        </p>
      )}
      {operationId && (
        <MemoryOperationPanel
          memoryId={memoryId}
          operationId={operationId}
          onRefresh={refresh}
        />
      )}
    </section>
  )
}
