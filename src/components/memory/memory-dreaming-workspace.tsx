import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { v4 as uuid } from 'uuid'
import { useTranslation } from 'react-i18next'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { memoryOperationReady } from '@/lib/memory-operation'
import { SectionCard } from '@/components/patterns/section-card'
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from '@/components/patterns/page-states'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  memoryCommandErrorKey,
  useMemoryCommand,
} from '@/hooks/use-memory-revisions'
import {
  memoryMaintenanceKeys,
  useMemoryMaintenanceCandidates,
  useMemoryMaintenanceJob,
  useMemoryMaintenanceJobs,
} from '@/hooks/use-memory-dreaming'
import type { MemoryCapabilities } from '@/types/memory-revisions'
import type {
  MemoryCandidateReview,
  MemoryMaintenanceCandidate,
  MemoryMaintenanceCommand,
} from '@/types/memory-dreaming'
import { MemoryDreamingForm } from './memory-dreaming-form'
import { MemoryDreamingCandidate } from './memory-dreaming-candidate'
import { MemoryDreamingJob } from './memory-dreaming-job'
import { MemoryOperationPanel } from './memory-operation-panel'
import { MemorySourcePanel } from './memory-source-panel'

const commandId = () => `memory-${uuid()}`
const knownRejection = (error: unknown) =>
  error instanceof APIError && [409, 422].includes(error.status)

export function MemoryDreamingWorkspace({
  memoryId,
  capabilities,
}: {
  memoryId: string
  capabilities: MemoryCapabilities
}) {
  const { t } = useTranslation()
  const cache = useQueryClient()
  const jobs = useMemoryMaintenanceJobs(memoryId)
  const [jobId, setJobId] = useState('')
  const [resumeJob, setResumeJob] = useState('')
  const job = useMemoryMaintenanceJob(memoryId, jobId)
  const candidates = useMemoryMaintenanceCandidates(memoryId, jobId)
  const [inspectedSources, setInspectedSources] = useState<string[]>([])
  const [createAttempt, setCreateAttempt] =
    useState<MemoryMaintenanceCommand | null>(null)
  const [runId, setRunId] = useState('')
  const [cancelId, setCancelId] = useState('')
  const [reviews, setReviews] = useState<Record<string, MemoryCandidateReview>>(
    {},
  )
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [publicationId, setPublicationId] = useState('')
  const [rejectedPublication, setRejectedPublication] = useState(false)
  const [publicationReady, setPublicationReady] = useState(false)
  const [feedback, setFeedback] = useState('')
  const publicationStatus = useCallback(
    (operation: Parameters<typeof memoryOperationReady>[0]) => {
      const ready =
        operation?.kind === 'dream_publish' &&
        operation.job_id === jobId &&
        memoryOperationReady(operation)
      setPublicationReady(ready)
      if (ready) setFeedback('')
    },
    [jobId],
  )
  const [resumePublication, setResumePublication] = useState('')
  const create = useMemoryCommand(
    memoryId,
    (command: MemoryMaintenanceCommand) =>
      memoryAPI.dreaming.create(memoryId, command),
  )
  const run = useMemoryCommand(memoryId, (operationId: string) =>
    memoryAPI.dreaming.run(memoryId, jobId, operationId),
  )
  const cancel = useMemoryCommand(memoryId, (operationId: string) =>
    memoryAPI.dreaming.cancel(memoryId, jobId, operationId),
  )
  const review = useMemoryCommand(
    memoryId,
    ({
      candidateId,
      command,
    }: {
      candidateId: string
      command: MemoryCandidateReview
    }) => memoryAPI.dreaming.review(memoryId, jobId, candidateId, command),
  )
  const publish = useMemoryCommand(
    memoryId,
    (command: {
      operation_id: string
      candidates: { candidate_id: string; expected_revision: number }[]
    }) => memoryAPI.dreaming.publish(memoryId, jobId, command),
  )
  const busy =
    create.isPending ||
    run.isPending ||
    cancel.isPending ||
    review.isPending ||
    publish.isPending
  const refresh = async () => {
    await cache.invalidateQueries({
      queryKey: memoryMaintenanceKeys.bank(memoryId),
    })
  }
  const selectJob = (id: string) => {
    setJobId(id)
    setSelected({})
    setReviews({})
    setRunId('')
    setCancelId('')
    setPublicationId('')
    setRejectedPublication(false)
    setPublicationReady(false)
    setFeedback('')
  }
  const submitCreate = async (command: MemoryMaintenanceCommand) => {
    setCreateAttempt(command)
    setFeedback('')
    try {
      const result = await create.mutateAsync(command)
      setCreateAttempt(null)
      selectJob(result.job_id)
    } catch (error) {
      setFeedback(
        knownRejection(error)
          ? 'memory.dreaming.conflict'
          : memoryCommandErrorKey(error),
      )
      if (knownRejection(error)) setCreateAttempt(null)
    } finally {
      await refresh()
    }
  }
  const submitReview = async (
    candidate: MemoryMaintenanceCandidate,
    decision: 'approve' | 'reject',
  ) => {
    const command = reviews[candidate.candidate_id] ?? {
      operation_id: commandId(),
      expected_revision: candidate.revision,
      decision,
    }
    setReviews((value) => ({ ...value, [candidate.candidate_id]: command }))
    setFeedback('')
    try {
      await review.mutateAsync({ candidateId: candidate.candidate_id, command })
      setReviews((value) => {
        const next = { ...value }
        delete next[candidate.candidate_id]
        return next
      })
      setSelected((value) => {
        const next = { ...value }
        delete next[candidate.candidate_id]
        return next
      })
    } catch (error) {
      setFeedback(
        knownRejection(error)
          ? 'memory.dreaming.conflict'
          : memoryCommandErrorKey(error),
      )
      if (knownRejection(error))
        setReviews((value) => {
          const next = { ...value }
          delete next[candidate.candidate_id]
          return next
        })
    } finally {
      await refresh()
    }
  }
  const unavailable =
    !!job.data &&
    ['cancel_requested', 'canceled', 'stale', 'redacted'].includes(
      job.data.state,
    )
  const activeCandidates = (candidates.data?.candidates ?? []).map(
    (candidate) =>
      unavailable
        ? {
            ...candidate,
            state: 'redacted' as const,
            redacted: true,
            content: null,
            base_content: null,
            patch: null,
            diff: null,
            reason: null,
          }
        : candidate,
  )
  const publishable = activeCandidates.filter(
    (candidate) =>
      candidate.state === 'approved' &&
      !candidate.redacted &&
      candidate.action !== 'noop' &&
      selected[candidate.candidate_id] === candidate.revision,
  )
  const maxPublish = capabilities.maintenance?.max_publication_candidates ?? 16
  return (
    <div className="space-y-space-lg">
      <SectionCard title={t('memory.dreaming.newJob')}>
        <MemoryDreamingForm
          disabled={busy || !!createAttempt}
          managed={capabilities.revisions?.managed === true}
          maxSources={capabilities.maintenance?.max_sources ?? 32}
          onInspectSources={setInspectedSources}
          onCreate={(command) =>
            void submitCreate({ operation_id: commandId(), ...command })
          }
        />
        {createAttempt && !create.isPending && (
          <Alert variant="warning" className="mt-space-base space-y-space-sm">
            <p>{t('memory.dreaming.createUnknown')}</p>
            <p className="font-mono text-xs break-all">
              {createAttempt.operation_id}
            </p>
            <div className="flex flex-wrap gap-space-sm">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  const result = await jobs.refetch()
                  const found = result.data?.jobs.find(
                    (item) => item.operation_id === createAttempt.operation_id,
                  )
                  if (found) {
                    setCreateAttempt(null)
                    selectJob(found.job_id)
                  }
                }}
              >
                {t('memory.dreaming.findCreatedJob')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void submitCreate(createAttempt)}
              >
                {t('memory.dreaming.retryCreate')}
              </Button>
            </div>
          </Alert>
        )}
        {!!inspectedSources.length && (
          <details open className="mt-space-base space-y-space-sm">
            <summary className="cursor-pointer text-sm font-medium">
              {t('memory.dreaming.sourceRegistration')}
            </summary>
            <p className="text-sm text-text-secondary">
              {t('memory.dreaming.registrationBoundary')}
            </p>
            {inspectedSources.map((sourceId) => (
              <MemorySourcePanel
                key={sourceId}
                memoryId={memoryId}
                sourceId={sourceId}
              />
            ))}
          </details>
        )}
      </SectionCard>
      {feedback && (
        <Alert variant="warning" role="alert">
          {t(feedback)}
        </Alert>
      )}
      <SectionCard title={t('memory.dreaming.jobs')}>
        <div className="flex flex-wrap items-end gap-space-sm">
          <div className="min-w-0 flex-1 space-y-space-xs">
            <Label htmlFor="maintenance-job-select">
              {t('memory.dreaming.job')}
            </Label>
            <Select
              value={jobId || 'none'}
              disabled={busy || !!createAttempt}
              onValueChange={(value) =>
                selectJob(value === 'none' ? '' : value)
              }
            >
              <SelectTrigger id="maintenance-job-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t('memory.dreaming.selectJob')}
                </SelectItem>
                {(jobs.data?.jobs ?? []).map((item) => (
                  <SelectItem key={item.job_id} value={item.job_id}>
                    {item.job_id} ·{' '}
                    {t(`memory.dreaming.jobStates.${item.state}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            disabled={busy || jobs.isFetching}
            onClick={() => void refresh()}
          >
            {t('memory.revisions.refreshStatus')}
          </Button>
        </div>
        <div className="mt-space-sm flex items-end gap-space-sm">
          <div className="min-w-0 flex-1 space-y-space-xs">
            <Label htmlFor="maintenance-resume-job">
              {t('memory.dreaming.resumeJob')}
            </Label>
            <Input
              id="maintenance-resume-job"
              value={resumeJob}
              onChange={(event) => setResumeJob(event.target.value)}
            />
          </div>
          <Button
            variant="outline"
            disabled={busy || !!createAttempt || !resumeJob.trim()}
            onClick={() => selectJob(resumeJob.trim())}
          >
            {t('memory.dreaming.open')}
          </Button>
        </div>
        {jobs.isError && <PageErrorState onRetry={() => jobs.refetch()} />}
        {jobId && (
          <div className="mt-space-lg space-y-space-base">
            {job.isPending ? (
              <PageLoadingState />
            ) : job.isError || !job.data ? (
              <PageErrorState onRetry={() => job.refetch()} />
            ) : (
              <>
                <MemoryDreamingJob job={job.data} />
                <div className="flex flex-wrap gap-space-sm">
                  <Button
                    disabled={
                      busy || !['pending', 'failed'].includes(job.data.state)
                    }
                    onClick={async () => {
                      const operationId =
                        job.data.analysis_operation_id || runId || commandId()
                      setRunId(operationId)
                      setFeedback('')
                      try {
                        await run.mutateAsync(operationId)
                      } catch (error) {
                        setFeedback(memoryCommandErrorKey(error))
                      } finally {
                        await refresh()
                      }
                    }}
                  >
                    {t('memory.dreaming.run')}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={
                      busy ||
                      [
                        'canceled',
                        'redacted',
                        'stale',
                        'cancel_requested',
                      ].includes(job.data.state)
                    }
                    onClick={async () => {
                      const operationId = cancelId || commandId()
                      setCancelId(operationId)
                      setFeedback('')
                      try {
                        await cancel.mutateAsync(operationId)
                      } catch (error) {
                        setFeedback(memoryCommandErrorKey(error))
                      } finally {
                        await refresh()
                      }
                    }}
                  >
                    {t('memory.dreaming.cancel')}
                  </Button>
                </div>
                <p className="text-xs text-text-secondary">
                  {t('memory.dreaming.explicitRun')}
                </p>
                {runId && (
                  <p className="font-mono text-xs break-all">
                    {t('memory.dreaming.analysisOperation')}: {runId}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </SectionCard>
      {jobId && (
        <SectionCard title={t('memory.dreaming.candidates')}>
          {candidates.isPending ? (
            <PageLoadingState />
          ) : candidates.isError ? (
            <PageErrorState onRetry={() => candidates.refetch()} />
          ) : !activeCandidates.length ? (
            <PageEmptyState
              title={t('memory.dreaming.noCandidates')}
              description={t('memory.dreaming.noCandidatesDescription')}
            />
          ) : (
            <div className="space-y-space-base">
              {activeCandidates.map((candidate) => (
                <MemoryDreamingCandidate
                  key={candidate.candidate_id}
                  candidate={candidate}
                  selected={
                    selected[candidate.candidate_id] === candidate.revision
                  }
                  selectionDisabled={
                    busy ||
                    !!publicationId ||
                    (!selected[candidate.candidate_id] &&
                      publishable.length >= maxPublish)
                  }
                  busy={busy || !!publicationId}
                  retainedReview={reviews[candidate.candidate_id]}
                  onSelect={(checked) =>
                    setSelected((value) => {
                      const next = { ...value }
                      if (checked)
                        next[candidate.candidate_id] = candidate.revision
                      else delete next[candidate.candidate_id]
                      return next
                    })
                  }
                  onReview={(decision) =>
                    void submitReview(candidate, decision)
                  }
                />
              ))}
            </div>
          )}
          <div className="mt-space-base space-y-space-sm">
            <p className="text-xs text-text-secondary">
              {t('memory.dreaming.publishBoundary', { count: maxPublish })}
            </p>
            <Button
              disabled={
                busy ||
                !!publicationId ||
                !publishable.length ||
                publishable.length > maxPublish
              }
              onClick={async () => {
                const operationId = commandId()
                setPublicationId(operationId)
                setRejectedPublication(false)
                setPublicationReady(false)
                setFeedback('')
                try {
                  await publish.mutateAsync({
                    operation_id: operationId,
                    candidates: publishable.map((candidate) => ({
                      candidate_id: candidate.candidate_id,
                      expected_revision: candidate.revision,
                    })),
                  })
                } catch (error) {
                  setRejectedPublication(knownRejection(error))
                  setFeedback(
                    knownRejection(error)
                      ? 'memory.dreaming.conflict'
                      : memoryCommandErrorKey(error),
                  )
                } finally {
                  await refresh()
                }
              }}
            >
              {t('memory.dreaming.publishSelected', {
                count: publishable.length,
              })}
            </Button>
          </div>
          <div className="mt-space-base flex items-end gap-space-sm">
            <div className="min-w-0 flex-1 space-y-space-xs">
              <Label htmlFor="maintenance-resume-publication">
                {t('memory.dreaming.resumePublication')}
              </Label>
              <Input
                id="maintenance-resume-publication"
                value={resumePublication}
                onChange={(event) => setResumePublication(event.target.value)}
              />
            </div>
            <Button
              variant="outline"
              disabled={busy || !resumePublication.trim()}
              onClick={() => setPublicationId(resumePublication.trim())}
            >
              {t('memory.dreaming.open')}
            </Button>
          </div>
          {publicationId && (
            <div className="mt-space-base space-y-space-sm">
              <MemoryOperationPanel
                memoryId={memoryId}
                operationId={publicationId}
                onRefresh={() => void refresh()}
                onStatus={publicationStatus}
              />
              {rejectedPublication && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await memoryAPI.revision.operation(
                        memoryId,
                        publicationId,
                      )
                      setFeedback('memory.revisions.inflight')
                    } catch (error) {
                      if (error instanceof APIError && error.status === 404) {
                        await refresh()
                        setPublicationId('')
                        setRejectedPublication(false)
                        setSelected({})
                        setFeedback('memory.dreaming.conflict')
                      } else setFeedback(memoryCommandErrorKey(error))
                    }
                  }}
                >
                  {t('memory.dreaming.refreshRejected')}
                </Button>
              )}
              {publicationReady && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPublicationId('')
                    setPublicationReady(false)
                    setSelected({})
                    void refresh()
                  }}
                >
                  {t('memory.dreaming.anotherBatch')}
                </Button>
              )}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  )
}
