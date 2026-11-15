import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { v4 as uuid } from 'uuid'
import { memoryAPI } from '@/api/memory'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/patterns/section-card'
import { useMemoryDiscoveryCommand } from '@/hooks/use-memory-incremental'
import type {
  MemoryDiscovery,
  MemoryDiscoveryRun,
  MemoryDiscoveryProfile,
} from '@/types/memory-incremental'
import { MemoryExecutionStatus } from './memory-execution-status'
import {
  MemoryDiscoveryCountsView,
  MemoryDiscoveryProfileView,
  MemoryDiscoverySourcePlan,
  MemoryIncrementalBoundaries,
} from './memory-incremental-metadata'
import { incrementalErrorKey } from '@/lib/memory-incremental'

const identity = () => `memory-discovery-${uuid()}`

export function MemoryDiscoveryDetail({
  memoryId,
  value,
  maxRuns,
  onRefresh,
  onPreviewProfile,
}: {
  memoryId: string
  value: MemoryDiscovery
  maxRuns: number
  onRefresh: () => void
  onPreviewProfile: (profile: MemoryDiscoveryProfile) => void
}) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const runId = params.get('run') ?? '',
    cancelId = params.get('cancel') ?? ''
  const storedLimit = params.get('run_limit')
  const [limit, setLimit] = useState(1)
  const maximum = Math.min(8, maxRuns)
  const originalLimit =
    storedLimit && /^[1-8]$/.test(storedLimit) ? Number(storedLimit) : null
  const run = useMemoryDiscoveryCommand(
    memoryId,
    (command: MemoryDiscoveryRun) =>
      memoryAPI.incremental.run(memoryId, value.discovery_id, command),
  )
  const cancel = useMemoryDiscoveryCommand(memoryId, (operationId: string) =>
    memoryAPI.incremental.cancel(memoryId, value.discovery_id, operationId),
  )
  const runAcknowledged = run.isSuccess && run.variables.operation_id === runId
  const cancelAcknowledged = cancel.isSuccess && cancel.variables === cancelId
  const replay = !!runId && !runAcknowledged
  const validLimit = Number.isInteger(limit) && limit >= 1 && limit <= maximum
  const workRemains = value.batches.some((batch) =>
    ['planned', 'created', 'unknown'].includes(batch.state),
  )
  const busy = run.isPending || cancel.isPending
  const submit = async () => {
    if (
      cancelId ||
      (!replay && !validLimit) ||
      (replay && originalLimit === null)
    )
      return
    const command = {
      operation_id: replay ? runId : identity(),
      limit: replay ? originalLimit! : limit,
    }
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('run', command.operation_id)
      next.set('run_limit', String(command.limit))
      return next
    })
    try {
      await run.mutateAsync(command)
    } catch {
      /* Keep the exact original command in the URL; reads do not replay it. */
    }
  }
  const stop = async () => {
    const id = cancelId || identity()
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('cancel', id)
      return next
    })
    try {
      await cancel.mutateAsync(id)
    } catch {
      /* Cancellation and actual drain remain server-owned. */
    }
  }
  const runError = run.isError && run.variables.operation_id === runId
  const cancelError = cancel.isError && cancel.variables === cancelId
  return (
    <SectionCard title={t('memory.incremental.planDetail')}>
      <div className="space-y-space-base">
        <dl className="grid gap-space-sm text-sm md:grid-cols-2">
          <dt>{t('memory.incremental.knownBatch')}</dt>
          <dd className="font-mono break-all">{value.discovery_id}</dd>
          <dt>{t('memory.incremental.knownRequest')}</dt>
          <dd className="font-mono break-all">{value.operation_id}</dd>
          <dt>{t('memory.incremental.planState')}</dt>
          <dd>{t(`memory.incremental.discoveryStates.${value.state}`)}</dd>
        </dl>
        <Alert variant="info">{t('memory.incremental.progressBoundary')}</Alert>
        <dl className="grid grid-cols-2 gap-space-base text-sm md:grid-cols-4">
          {(
            [
              'planned',
              'created',
              'submitted',
              'running',
              'analyzed',
              'failed',
              'canceled',
              'blocked',
              'pending',
            ] as const
          ).map((key) => (
            <div key={key}>
              <dt className="text-xs text-text-secondary">
                {t(`memory.incremental.progress.${key}`)}
              </dt>
              <dd className="font-medium">{value.progress[key]}</dd>
            </div>
          ))}
        </dl>
        <MemoryDiscoveryCountsView value={value.counts} snapshot />
        <p className="text-xs text-text-secondary">
          {t('memory.incremental.snapshotHint')}
        </p>
        <Button
          variant="outline"
          className="h-auto min-h-9 max-w-full text-left whitespace-normal"
          onClick={() => onPreviewProfile(value.profile)}
        >
          {t('memory.incremental.previewSavedProfile')}
        </Button>
        <MemoryDiscoveryProfileView
          profile={value.profile}
          fingerprint={value.profile_sha256}
        />
        <MemoryIncrementalBoundaries hasMore={value.has_more} />
        <div className="flex flex-wrap items-end gap-space-sm">
          <div className="space-y-space-xs">
            <Label htmlFor="incremental-run-limit">
              {t('memory.incremental.runLimit')}
            </Label>
            <Input
              id="incremental-run-limit"
              className="max-w-xs"
              type="number"
              min={1}
              max={maximum}
              value={
                replay
                  ? (originalLimit ?? '')
                  : Number.isNaN(limit)
                    ? ''
                    : limit
              }
              disabled={busy || replay || !!cancelId}
              onChange={(event) => setLimit(event.target.valueAsNumber)}
            />
          </div>
          <Button
            disabled={
              busy ||
              !!cancelId ||
              (replay ? originalLimit === null : !workRemains || !validLimit) ||
              ['canceled', 'stale'].includes(value.state)
            }
            onClick={() => void submit()}
          >
            {t(
              replay
                ? 'memory.incremental.retryOriginalRun'
                : 'memory.incremental.submitChildren',
            )}
          </Button>
          <Button variant="outline" onClick={onRefresh}>
            {t('memory.revisions.refreshStatus')}
          </Button>
          <Button
            variant="outline"
            disabled={
              busy ||
              value.state === 'stale' ||
              (value.state === 'canceled' && (!cancelId || cancelAcknowledged))
            }
            className="h-auto min-h-9 max-w-full whitespace-normal"
            onClick={() => void stop()}
          >
            {t(
              cancelId
                ? 'memory.incremental.retryCancel'
                : 'memory.incremental.cancelPlan',
            )}
          </Button>
        </div>
        <p className="text-xs text-text-secondary">
          {t('memory.incremental.runBoundary')}
        </p>
        {runId && (
          <Alert
            variant={runError ? 'warning' : 'info'}
            className="space-y-space-xs"
          >
            <p>
              {t(
                runError
                  ? incrementalErrorKey(run.error)
                  : runAcknowledged
                    ? 'memory.incremental.runAccepted'
                    : 'memory.incremental.runRecovery',
              )}
            </p>
            <p className="font-mono text-xs break-all">{runId}</p>
          </Alert>
        )}
        {cancelId && (
          <Alert variant="warning" className="space-y-space-xs">
            <p>
              {t(
                cancelError
                  ? incrementalErrorKey(cancel.error)
                  : 'memory.incremental.cancelBoundary',
              )}
            </p>
            <p className="font-mono text-xs break-all">{cancelId}</p>
          </Alert>
        )}
        <ol className="space-y-space-base">
          {value.batches.map((batch) => (
            <li
              key={batch.batch_id}
              className="space-y-space-sm rounded-radius-lg border border-border-default p-space-base"
            >
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <h3 className="text-sm font-medium">
                  {t('memory.incremental.childOrdinal', {
                    ordinal: batch.ordinal,
                  })}{' '}
                  · {t(`memory.incremental.batchStates.${batch.state}`)}
                </h3>
                {batch.job_id && batch.job_state && (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`/memory/${encodeURIComponent(memoryId)}/maintenance?${new URLSearchParams({ job: batch.job_id, operation: batch.analysis_operation_id })}`}
                    >
                      {t('memory.incremental.openChild')}
                    </Link>
                  </Button>
                )}
              </div>
              <p className="font-mono text-xs break-all">{batch.batch_id}</p>
              {!batch.job_state && (
                <p className="text-xs text-text-secondary">
                  {t('memory.incremental.jobNotCreated')}
                </p>
              )}
              {batch.error_code && (
                <p className="text-xs text-status-warning">
                  {t('memory.incremental.errorCode')}: {batch.error_code}
                </p>
              )}
              <MemoryExecutionStatus execution={batch.execution} />
              {['blocked', 'stale', 'failed', 'unknown'].includes(
                batch.state,
              ) && (
                <Alert variant="warning">
                  {t('memory.incremental.childNotCovered')}
                </Alert>
              )}
              <MemoryDiscoverySourcePlan batches={[batch]} />
              <details className="text-xs">
                <summary className="cursor-pointer">
                  {t('memory.incremental.originalHandles')}
                </summary>
                <dl className="mt-space-sm grid gap-space-sm md:grid-cols-2">
                  <dt>{t('memory.incremental.createHandle')}</dt>
                  <dd className="font-mono break-all">
                    {batch.create_operation_id}
                  </dd>
                  <dt>{t('memory.dreaming.analysisOperation')}</dt>
                  <dd className="font-mono break-all">
                    {batch.analysis_operation_id}
                  </dd>
                  <dt>{t('memory.dreaming.job')}</dt>
                  <dd className="font-mono break-all">{batch.job_id}</dd>
                </dl>
              </details>
            </li>
          ))}
        </ol>
      </div>
    </SectionCard>
  )
}
