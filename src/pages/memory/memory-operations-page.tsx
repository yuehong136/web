import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from '@/components/patterns/page-states'
import { SectionCard } from '@/components/patterns/section-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { MemorySidebar } from '@/components/memory/MemorySidebar'
import { MemoryOperationPanel } from '@/components/memory/memory-operation-panel'
import { useRegisterSecondaryNavigation } from '@/components/layout/workbench-navigation'
import { useMemoryOperationInbox } from '@/hooks/use-memory-operation-inbox'
import { useMemoryRecoverySelection } from '@/hooks/use-memory-recovery-selection'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import {
  clearDeletedMemory,
  clearUnavailableMemoryBodies,
  confirmedMemoryDeletion,
} from '@/hooks/memory-deletion-cache'
import type {
  MemoryOperation,
  MemoryOperationSummary,
} from '@/types/memory-revisions'
import { memoryOperationReady } from '@/lib/memory-operation'

function operationLabel(operation: MemoryOperationSummary): string {
  if (
    operation.needs_operator_reconciliation ||
    operation.execution?.needs_operator_reconciliation
  )
    return 'memory.recovery.operatorNeeded'
  if (operation.execution)
    return `memory.recovery.executionStates.${operation.execution.state}`
  if (
    operation.status === 'persistence_unknown' ||
    operation.index_sync_status === 'unknown'
  )
    return 'memory.recovery.unknown'
  return memoryOperationReady(operation)
    ? 'memory.recovery.ready'
    : 'memory.recovery.pending'
}

export function MemoryOperationsPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <MemoryOperations key={id} memoryId={id} /> : null
}

function MemoryOperations({ memoryId }: { memoryId: string }) {
  const { t, i18n } = useTranslation()
  const cache = useQueryClient()
  const [params, setParams] = useSearchParams()
  const { operationId, selectOperation } = useMemoryRecoverySelection()
  const view = params.get('view') === 'all' ? 'all' : 'pending'
  const [pagination, setPagination] = useState<{
    view: string
    cursors: string[]
  }>({ view, cursors: [] })
  const cursors = pagination.view === view ? pagination.cursors : []
  const cursor = cursors.at(-1)
  const inbox = useMemoryOperationInbox(memoryId, view, cursor)
  const memoryState = inbox.data?.memory_state
  const [manualId, setManualId] = useState('')
  const clearedDeletion = useRef('')
  const definition = useMemo(
    () => ({
      section: 'knowledge' as const,
      title: t('memory.recovery.title'),
      groups: [],
      contentOnly: true,
      content: <MemorySidebar memory={null} memoryId={memoryId} recoveryOnly />,
    }),
    [memoryId, t],
  )
  const managed = useRegisterSecondaryNavigation(definition)
  useEffect(() => {
    if (!operationId && inbox.data?.operations[0]) {
      const first = inbox.data.operations[0]
      selectOperation(first.operation_id, first.job_id ?? undefined, {
        replace: true,
      })
    }
  }, [operationId, inbox.data, selectOperation])
  useEffect(() => {
    if (
      inbox.data?.memory_state === 'deleted' &&
      !params.has('view') &&
      !inbox.data.operations.length
    ) {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          next.set('view', 'all')
          return next
        },
        { replace: true },
      )
    }
  }, [inbox.data, params, setParams])
  useEffect(() => {
    if (memoryState && memoryState !== 'active')
      void clearUnavailableMemoryBodies(cache, memoryId)
  }, [cache, memoryId, memoryState])
  const selectedSummary = inbox.data?.operations.find(
    (operation) => operation.operation_id === operationId,
  )
  useEffect(() => {
    if (selectedSummary)
      void cache.invalidateQueries({
        queryKey: memoryRevisionKeys.operation(
          memoryId,
          selectedSummary.operation_id,
        ),
      })
  }, [cache, memoryId, selectedSummary])
  const onStatus = useCallback(
    (operation: MemoryOperation) => {
      if (
        confirmedMemoryDeletion(operation) &&
        clearedDeletion.current !== operation.operation_id
      ) {
        clearedDeletion.current = operation.operation_id
        void clearDeletedMemory(cache, memoryId)
      }
    },
    [cache, memoryId],
  )
  const refresh = () => {
    void inbox.refetch()
    if (operationId)
      void cache.invalidateQueries({
        queryKey: memoryRevisionKeys.operation(memoryId, operationId),
      })
  }
  const changeView = (nextView: 'pending' | 'all') => {
    setPagination({ view: nextView, cursors: [] })
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('view', nextView)
      return next
    })
  }
  const formatTime = (value: string) =>
    Number.isNaN(Date.parse(value))
      ? '—'
      : new Intl.DateTimeFormat(i18n.resolvedLanguage, {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(value))
  return (
    <ConsolePageTemplate
      rail={
        managed ? undefined : (
          <div className="hidden w-64 shrink-0 md:block">
            <MemorySidebar memory={null} memoryId={memoryId} recoveryOnly />
          </div>
        )
      }
      header={
        <PageHeader
          title={t('memory.recovery.title')}
          description={t('memory.recovery.bankIdentifier', { id: memoryId })}
          actions={
            <Button asChild variant="ghost">
              <Link to="/memory">
                <ArrowLeft className="size-icon-sm" />
                {t('memory.common.allMemories')}
              </Link>
            </Button>
          }
        />
      }
    >
      <div className="space-y-space-lg p-space-lg">
        <Alert variant="info">{t('memory.recovery.readOnlyBoundary')}</Alert>
        {inbox.data?.memory_state && inbox.data.memory_state !== 'active' && (
          <Alert variant="warning">
            {t(`memory.recovery.memoryStates.${inbox.data.memory_state}`)}
          </Alert>
        )}
        {inbox.data?.memory_state === 'active' && (
          <Button asChild variant="outline">
            <Link to={`/memory/${encodeURIComponent(memoryId)}`}>
              {t('memory.recovery.openMemory')}
            </Link>
          </Button>
        )}
        <SectionCard title={t('memory.recovery.inbox')}>
          <div className="mb-space-base flex flex-wrap gap-space-sm">
            <Button
              variant={view === 'pending' ? 'secondary' : 'outline'}
              onClick={() => changeView('pending')}
            >
              {t('memory.recovery.pendingView')}
            </Button>
            <Button
              variant={view === 'all' ? 'secondary' : 'outline'}
              onClick={() => changeView('all')}
            >
              {t('memory.recovery.allView')}
            </Button>
            <Button
              variant="outline"
              disabled={inbox.isFetching}
              onClick={refresh}
            >
              {t('memory.revisions.refreshStatus')}
            </Button>
          </div>
          {inbox.isPending ? (
            <PageLoadingState />
          ) : inbox.isError ? (
            <PageErrorState
              description={t('memory.recovery.discoveryFailed')}
              onRetry={() => inbox.refetch()}
            />
          ) : !inbox.data.operations.length ? (
            <PageEmptyState
              title={t('memory.recovery.empty')}
              description={t('memory.recovery.emptyDescription')}
            />
          ) : (
            <ul className="space-y-space-sm">
              {inbox.data.operations.map((operation) => (
                <li
                  key={operation.operation_id}
                  className="space-y-space-sm rounded-radius-lg border border-border-default p-space-base"
                >
                  <button
                    type="button"
                    className="w-full space-y-space-xs text-left focus-visible:ring-2 focus-visible:ring-state-focus"
                    aria-pressed={operationId === operation.operation_id}
                    onClick={() =>
                      selectOperation(
                        operation.operation_id,
                        operation.job_id ?? undefined,
                      )
                    }
                  >
                    <span className="block text-sm font-medium">
                      {t(operationLabel(operation))}
                    </span>
                    <span className="block font-mono text-xs break-all">
                      {operation.operation_id}
                    </span>
                    <span className="block text-xs text-text-secondary">
                      {operation.kind} · {formatTime(operation.updated_at)}
                    </span>
                  </button>
                  {operation.job_id && inbox.data.memory_state === 'active' && (
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to={`/memory/${encodeURIComponent(memoryId)}/maintenance?${new URLSearchParams({ job: operation.job_id, operation: operation.operation_id })}`}
                      >
                        {t('memory.recovery.openJob')}
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-space-base flex gap-space-sm">
            <Button
              variant="outline"
              disabled={!cursors.length || inbox.isFetching}
              onClick={() =>
                setPagination({ view, cursors: cursors.slice(0, -1) })
              }
            >
              {t('memory.recovery.previous')}
            </Button>
            <Button
              variant="outline"
              disabled={!inbox.data?.next_cursor || inbox.isFetching}
              onClick={() =>
                setPagination({
                  view,
                  cursors: [...cursors, inbox.data!.next_cursor!],
                })
              }
            >
              {t('memory.recovery.next')}
            </Button>
          </div>
        </SectionCard>
        <SectionCard title={t('memory.recovery.knownOperation')}>
          <form
            className="flex items-end gap-space-sm"
            onSubmit={(event) => {
              event.preventDefault()
              if (manualId.trim()) selectOperation(manualId.trim())
            }}
          >
            <div className="min-w-0 flex-1 space-y-space-xs">
              <Label htmlFor="memory-known-operation">
                {t('memory.revisions.operation')}
              </Label>
              <Input
                id="memory-known-operation"
                value={manualId}
                onChange={(event) => setManualId(event.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" disabled={!manualId.trim()}>
              {t('memory.dreaming.open')}
            </Button>
          </form>
        </SectionCard>
        {operationId && (
          <MemoryOperationPanel
            key={operationId}
            memoryId={memoryId}
            operationId={operationId}
            poll
            onRefresh={refresh}
            onStatus={onStatus}
          />
        )}
      </div>
    </ConsolePageTemplate>
  )
}
