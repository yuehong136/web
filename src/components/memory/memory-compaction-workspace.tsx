import { v4 as uuid } from 'uuid'
import { useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import { useMemoryCompaction } from '@/hooks/use-memory-compaction'
import { compactionCanStartNew } from '@/lib/memory-compaction'
import { SectionCard } from '@/components/patterns/section-card'
import {
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { MemoryCompactionCommand } from '@/types/memory-compaction'
import { MemoryCompactionForm } from './memory-compaction-form'
import { MemoryCompactionArtifactView } from './memory-compaction-artifact'
import { MemorySourcePanel } from './memory-source-panel'
import { MemoryCompactionRecent } from './memory-compaction-recent'
import { MemoryCompactionRetention } from './memory-compaction-retention'

export function MemoryCompactionWorkspace({
  memoryId,
  operationIdFactory,
}: {
  memoryId: string
  operationIdFactory?: () => string
}) {
  const actor = useAuthStore((s) => s.token)
  return (
    <CompactionOwner
      key={memoryId + ':' + actor}
      memoryId={memoryId}
      operationIdFactory={operationIdFactory}
    />
  )
}
function CompactionOwner({
  memoryId,
  operationIdFactory = () => 'compaction-' + uuid(),
}: {
  memoryId: string
  operationIdFactory?: () => string
}) {
  const { t } = useTranslation(),
    cap = useMemoryCapabilities(memoryId)
  const [params, setParams] = useSearchParams(),
    operationId = params.get('compaction_operation') ?? ''
  const state = useMemoryCompaction(memoryId, operationId)
  const [inspect, setInspect] = useState<string[]>([]),
    [formEpoch, setFormEpoch] = useState(0)
  const admitted = useRef('')
  const previousOperation = useRef(operationId)
  useLayoutEffect(() => {
    if (previousOperation.current && !operationId) {
      admitted.current = ''
      setInspect([])
      setFormEpoch((n) => n + 1)
    }
    previousOperation.current = operationId
  }, [operationId])
  const supported = cap.data?.context_compactions?.supported === true
  const enabled = supported && cap.data?.revisions?.managed === true
  const submit = (body: Omit<MemoryCompactionCommand, 'operation_id'>) => {
    if (!enabled || operationId || admitted.current) return
    const id = operationIdFactory()
    admitted.current = id
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('compaction_operation', id)
      return next
    })
    state.command.mutate({
      kind: 'create',
      body: { ...body, operation_id: id },
    })
  }
  const value = state.query.data,
    operation = value?.operation
  const startNew = () => {
    if (state.retirementPending || !compactionCanStartNew(value)) return
    admitted.current = ''
    setInspect([])
    setFormEpoch((n) => n + 1)
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('compaction_operation')
      return next
    })
  }
  const status =
    value?.artifact?.state === 'stale'
      ? 'stale'
      : operation?.status === 'canceled'
        ? 'canceled'
        : operation?.needs_operator_reconciliation
          ? 'persistence_unknown'
          : operation?.writer_busy
            ? 'running'
            : (operation?.status ?? 'persistence_unknown')
  return (
    <div className="min-w-0 space-y-space-lg">
      {cap.isPending ? (
        <PageLoadingState />
      ) : cap.isError ? (
        <PageErrorState onRetry={() => cap.refetch()} />
      ) : (
        !enabled && (
          <Alert variant="warning">
            {t(
              supported
                ? 'memory.compaction.requiresManaged'
                : 'memory.compaction.unsupported',
            )}
          </Alert>
        )
      )}
      <MemoryCompactionRetention
        key={operationId || 'inventory'}
        memoryId={memoryId}
        capability={
          enabled ? cap.data?.context_compactions?.retention : undefined
        }
        current={value}
        waitingForReceipt={state.retirementPending}
        onFence={state.fenceRetirement}
      />
      <SectionCard title={t('memory.compaction.newRequest')}>
        <MemoryCompactionForm
          key={formEpoch}
          locked={!!operationId || state.command.isPending}
          enabled={enabled}
          onGenerate={submit}
          onInspect={setInspect}
        />
      </SectionCard>
      {!!inspect.length && (
        <SectionCard title={t('memory.compaction.inspect')}>
          <div className="space-y-space-base">
            {inspect.map((sourceId) => (
              <MemorySourcePanel
                key={sourceId}
                memoryId={memoryId}
                sourceId={sourceId}
              />
            ))}
          </div>
        </SectionCard>
      )}
      {operationId && (
        <SectionCard title={t('memory.compaction.operation')}>
          <div className="min-w-0 space-y-space-sm">
            <p className="font-mono text-xs break-all">{operationId}</p>
            <Alert
              variant={
                status === 'generated' && !operation?.writer_busy
                  ? 'info'
                  : 'warning'
              }
            >
              {t('memory.compaction.states.' + status)}
            </Alert>
            {operation?.writer_busy && (
              <Alert variant="warning">{t('memory.compaction.draining')}</Alert>
            )}
            {operation?.needs_operator_reconciliation && (
              <Alert variant="warning">
                {t('memory.compaction.operatorRequired')}
              </Alert>
            )}
            {state.failure && (
              <Alert variant="warning">{t(state.failure)}</Alert>
            )}
            {state.query.isError && (
              <Alert variant="warning">
                {t('memory.compaction.readFailed')}
              </Alert>
            )}
            <div className="flex flex-wrap gap-space-sm">
              <Button
                type="button"
                variant="outline"
                disabled={state.query.isFetching}
                onClick={() => {
                  state.clearBody()
                  void state.query.refetch()
                }}
              >
                {t('memory.compaction.refresh')}
              </Button>
              {operation &&
                ['running', 'persistence_unknown'].includes(
                  operation.status,
                ) && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      state.command.isPending &&
                      state.command.variables?.kind === 'cancel'
                    }
                    onClick={() =>
                      state.command.mutate({ kind: 'cancel', operationId })
                    }
                  >
                    {t('memory.compaction.cancel')}
                  </Button>
                )}
              {!state.retirementPending && compactionCanStartNew(value) && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={state.command.isPending}
                  onClick={startNew}
                >
                  {t('memory.compaction.startNew')}
                </Button>
              )}
            </div>
          </div>
        </SectionCard>
      )}
      {value?.artifact && (
        <MemoryCompactionArtifactView
          key={value.artifact.artifact_id}
          value={value}
          onInvalid={state.clearBody}
          onCopyReference={() => void state.copyReference()}
          referencePending={state.referencePending}
          referenceFeedback={state.referenceFeedback}
        />
      )}
      <MemoryCompactionRecent
        memoryId={memoryId}
        enabled={supported}
        onSelect={(id) => {
          state.clearBody()
          setParams((previous) => {
            const next = new URLSearchParams(previous)
            next.set('compaction_operation', id)
            return next
          })
        }}
      />
    </div>
  )
}
