import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { v4 as uuid } from 'uuid'
import { incrementalErrorKey } from '@/lib/memory-incremental'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionCard } from '@/components/patterns/section-card'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { useMemoryActionScope } from '@/hooks/use-memory-action-scope'
import {
  useMemoryDiscoveries,
  useMemoryDiscovery,
  useMemoryDiscoveryCommand,
  useMemoryDiscoveryPreview,
} from '@/hooks/use-memory-incremental'
import type { MemoryCapabilities } from '@/types/memory-revisions'
import type {
  MemoryDiscoveryCreate,
  MemoryDiscoveryPreview,
  MemoryDiscoverySelection,
  MemoryDiscoveryProfile,
} from '@/types/memory-incremental'
import { MemoryIncrementalForm } from './memory-incremental-form'
import {
  MemoryDiscoveryCountsView,
  MemoryDiscoveryProfileView,
  MemoryDiscoverySourcePlan,
  MemoryIncrementalBoundaries,
} from './memory-incremental-metadata'
import { MemoryDiscoveryDetail } from './memory-incremental-detail'

const commandId = () => `memory-discovery-${uuid()}`
const rejected = (error: unknown) =>
  error instanceof APIError && [409, 422].includes(error.status)

export function MemoryIncrementalWorkspace({
  memoryId,
  capabilities,
}: {
  memoryId: string
  capabilities: NonNullable<
    NonNullable<MemoryCapabilities['maintenance']>['discoveries']
  >
}) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const discoveryId = params.get('batch') ?? ''
  const requestId = params.get('request') ?? ''
  const list = useMemoryDiscoveries(memoryId)
  const recover = useMemoryDiscoveries(
    memoryId,
    requestId || undefined,
    !!requestId && !discoveryId,
  )
  const detail = useMemoryDiscovery(memoryId, discoveryId)
  const preview = useMemoryDiscoveryPreview(memoryId)
  const create = useMemoryDiscoveryCommand(
    memoryId,
    (command: MemoryDiscoveryCreate) =>
      memoryAPI.incremental.create(memoryId, command),
  )
  const beginAction = useMemoryActionScope(memoryId, '', '')
  const formVersion = useRef(0)
  const [accepted, setAccepted] = useState<{
    selection: MemoryDiscoverySelection
    preview: MemoryDiscoveryPreview
  } | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [preset, setPreset] = useState<{
    selection: MemoryDiscoverySelection
    generation: number
  } | null>(null)
  const [manualBatch, setManualBatch] = useState('')
  const [manualRequest, setManualRequest] = useState('')
  const creationUnresolved = !!requestId && !discoveryId
  const select = useCallback(
    (id: string) =>
      setParams((previous) => {
        const next = new URLSearchParams(previous)
        if (id) next.set('batch', id)
        else next.delete('batch')
        for (const key of ['request', 'run', 'run_limit', 'cancel'])
          next.delete(key)
        return next
      }),
    [setParams],
  )
  useEffect(() => {
    if (discoveryId) return
    const found = requestId
      ? recover.data?.discoveries.find(
          (item) => item.operation_id === requestId,
        )
      : list.data?.discoveries[0]
    if (found) select(found.discovery_id)
  }, [discoveryId, requestId, recover.data, list.data, select])
  const dirty = () => {
    formVersion.current += 1
    setAccepted(null)
    setPreviewError('')
  }
  const readPreview = async (selection: MemoryDiscoverySelection) => {
    const current = beginAction(),
      version = formVersion.current
    setPreviewError('')
    try {
      const value = await preview.mutateAsync(selection)
      if (current() && version === formVersion.current)
        setAccepted({ selection, preview: value })
    } catch (error) {
      if (current() && version === formVersion.current)
        setPreviewError(incrementalErrorKey(error))
    }
  }
  const previewProfile = (profile: MemoryDiscoveryProfile) => {
    if (creationUnresolved) return
    const selection: MemoryDiscoverySelection = {
      scope: { ...profile.scope },
      policy: profile.policy,
      entry_ids: profile.entries.map((entry) => entry.entry_id),
      batch_size: Math.min(32, capabilities.max_batch_sources),
      max_sources: Math.min(128, capabilities.max_sources),
      input_budget_tokens: profile.input_budget_tokens,
      output_budget_tokens: profile.output_budget_tokens,
    }
    dirty()
    setPreset({ selection, generation: formVersion.current })
    void readPreview(selection)
  }
  const createPlan = async () => {
    if (!accepted || creationUnresolved) return
    const command: MemoryDiscoveryCreate = {
      ...accepted.selection,
      operation_id: commandId(),
      expected_preview_sha256: accepted.preview.preview_sha256,
    }
    setAccepted(null)
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      for (const key of ['batch', 'run', 'run_limit', 'cancel'])
        next.delete(key)
      next.set('request', command.operation_id)
      return next
    })
    try {
      await create.mutateAsync(command)
    } catch {
      /* The URL and exact server lookup retain the original request. */
    }
  }
  const creationRejected =
    creationUnresolved &&
    create.isError &&
    create.variables.operation_id === requestId &&
    rejected(create.error)
  const refresh = async () => {
    await Promise.all([
      list.refetch(),
      ...(discoveryId ? [detail.refetch()] : []),
      ...(creationUnresolved ? [recover.refetch()] : []),
    ])
  }
  return (
    <div className="space-y-space-lg">
      <MemoryIncrementalForm
        key={preset?.generation ?? 0}
        initialSelection={preset?.selection}
        capabilities={capabilities}
        pending={preview.isPending}
        locked={create.isPending || creationUnresolved}
        onDirty={dirty}
        onPreview={(selection) => void readPreview(selection)}
      />
      {previewError && (
        <Alert variant="warning" role="alert">
          {t(previewError)}
        </Alert>
      )}
      {accepted && !creationUnresolved && (
        <SectionCard title={t('memory.incremental.previewResult')}>
          <div className="space-y-space-base">
            <MemoryDiscoveryCountsView value={accepted.preview.counts} />
            <p className="text-xs text-text-secondary">
              {t('memory.incremental.registeredOnly')}
            </p>
            <MemoryIncrementalBoundaries hasMore={accepted.preview.has_more} />
            <MemoryDiscoveryProfileView
              profile={accepted.preview.profile}
              fingerprint={accepted.preview.profile_sha256}
            />
            <MemoryDiscoverySourcePlan batches={accepted.preview.batches} />
            {!accepted.preview.batches.length && (
              <PageEmptyState
                title={t('memory.incremental.noEligible')}
                description={t('memory.incremental.noEligibleHint')}
              />
            )}
            <Button
              disabled={create.isPending || !accepted.preview.batches.length}
              onClick={() => void createPlan()}
            >
              {t('memory.incremental.createPlan')}
            </Button>
            <p className="text-xs text-text-secondary">
              {t('memory.incremental.createBoundary')}
            </p>
          </div>
        </SectionCard>
      )}
      {creationUnresolved && (
        <Alert variant="warning" className="space-y-space-sm">
          <p>
            {t(
              creationRejected
                ? incrementalErrorKey(create.error)
                : 'memory.incremental.creationUnknown',
            )}
          </p>
          <p className="font-mono break-all">{requestId}</p>
          <Button
            variant="outline"
            disabled={recover.isFetching}
            onClick={() => void recover.refetch()}
          >
            {t('memory.incremental.findRequest')}
          </Button>
          {creationRejected && (
            <Button
              variant="outline"
              onClick={() => {
                dirty()
                select('')
              }}
            >
              {t('memory.incremental.repreview')}
            </Button>
          )}
          {recover.isError && <p>{t('memory.incremental.readFailed')}</p>}
        </Alert>
      )}
      <SectionCard title={t('memory.incremental.recentPlans')}>
        <div className="mb-space-base flex flex-wrap gap-space-sm">
          <Button variant="outline" onClick={() => void refresh()}>
            {t('memory.revisions.refreshStatus')}
          </Button>
          <p className="text-xs text-text-secondary">
            {t('memory.incremental.restoreHint')}
          </p>
        </div>
        {list.isPending ? (
          <PageLoadingState />
        ) : list.isError ? (
          <PageErrorState
            description={t('memory.incremental.readFailed')}
            onRetry={() => list.refetch()}
          />
        ) : !list.data.discoveries.length ? (
          <PageEmptyState title={t('memory.incremental.noPlans')} />
        ) : (
          <ul className="grid gap-space-sm md:grid-cols-2">
            {list.data.discoveries.map((item) => (
              <li key={item.discovery_id}>
                <Button
                  variant={
                    discoveryId === item.discovery_id ? 'secondary' : 'outline'
                  }
                  className="h-auto w-full flex-col items-start gap-space-xs text-left whitespace-normal"
                  onClick={() => select(item.discovery_id)}
                >
                  <span>
                    {t(`memory.incremental.discoveryStates.${item.state}`)}
                  </span>
                  <span className="max-w-full font-mono text-xs break-all">
                    {item.discovery_id}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-space-base grid gap-space-base md:grid-cols-2">
          <div className="space-y-space-sm">
            <Label htmlFor="incremental-restore-batch">
              {t('memory.incremental.knownBatch')}
            </Label>
            <div className="flex gap-space-sm">
              <Input
                id="incremental-restore-batch"
                value={manualBatch}
                onChange={(event) => setManualBatch(event.target.value)}
              />
              <Button
                variant="outline"
                disabled={!manualBatch.trim()}
                onClick={() => select(manualBatch.trim())}
              >
                {t('memory.dreaming.open')}
              </Button>
            </div>
          </div>
          <div className="space-y-space-sm">
            <Label htmlFor="incremental-restore-request">
              {t('memory.incremental.knownRequest')}
            </Label>
            <div className="flex gap-space-sm">
              <Input
                id="incremental-restore-request"
                value={manualRequest}
                onChange={(event) => setManualRequest(event.target.value)}
              />
              <Button
                variant="outline"
                disabled={!manualRequest.trim()}
                onClick={() =>
                  setParams((previous) => {
                    const next = new URLSearchParams(previous)
                    for (const key of ['batch', 'run', 'run_limit', 'cancel'])
                      next.delete(key)
                    next.set('request', manualRequest.trim())
                    return next
                  })
                }
              >
                {t('memory.incremental.findRequest')}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>
      {discoveryId &&
        (detail.isPending ? (
          <PageLoadingState />
        ) : detail.isError || !detail.data ? (
          <PageErrorState
            description={t('memory.incremental.readFailed')}
            onRetry={() => detail.refetch()}
          />
        ) : (
          <MemoryDiscoveryDetail
            key={discoveryId}
            memoryId={memoryId}
            value={detail.data}
            maxRuns={capabilities.max_runs_per_request}
            onPreviewProfile={previewProfile}
            onRefresh={() => void refresh()}
          />
        ))}
    </div>
  )
}
