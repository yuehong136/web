import { useCallback, useEffect, useState } from 'react'
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
  useMemoryOperation,
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
import { MemoryDreamingSetup } from './memory-dreaming-setup'
import { MemoryDreamingCandidate } from './memory-dreaming-candidate'
import { MemoryDreamingJobActions } from './memory-dreaming-job-actions'
import { MemoryOperationPanel } from './memory-operation-panel'
import { useMemoryOperationInbox } from '@/hooks/use-memory-operation-inbox'
import { useMemoryRecoverySelection } from '@/hooks/use-memory-recovery-selection'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import { useMemoryActionScope } from '@/hooks/use-memory-action-scope'

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
  const persistent =
    capabilities.maintenance?.execution === 'persistent_background'
  const jobs = useMemoryMaintenanceJobs(memoryId, true, persistent)
  const inbox = useMemoryOperationInbox(
    memoryId,
    'pending',
    undefined,
    persistent,
  )
  const {
    jobId,
    operationId,
    selectJob: selectRecoveryJob,
    selectOperation,
  } = useMemoryRecoverySelection()
  const selectedOperation = useMemoryOperation(
    memoryId,
    operationId,
    persistent,
  )
  const beginAction = useMemoryActionScope(memoryId, jobId, operationId)
  const publicationId =
    selectedOperation.data?.kind === 'dream_analyze' ? '' : operationId
  const setPublicationId = (id: string) => selectOperation(id, jobId)
  const [resumeJob, setResumeJob] = useState('')
  const job = useMemoryMaintenanceJob(memoryId, jobId, persistent)
  const candidates = useMemoryMaintenanceCandidates(memoryId, jobId, persistent)
  const [createAttempt, setCreateAttempt] =
    useState<MemoryMaintenanceCommand | null>(null)
  const [runId, setRunId] = useState('')
  const [cancelId, setCancelId] = useState('')
  const [reviews, setReviews] = useState<Record<string, MemoryCandidateReview>>(
    {},
  )
  const [selected, setSelected] = useState<Record<string, number>>({})
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
    await Promise.all([
      cache.invalidateQueries({
        queryKey: memoryMaintenanceKeys.bank(memoryId),
      }),
      cache.invalidateQueries({
        queryKey: memoryRevisionKeys.operations(memoryId),
      }),
      ...(operationId
        ? [
            cache.invalidateQueries({
              queryKey: memoryRevisionKeys.operation(memoryId, operationId),
            }),
          ]
        : []),
    ])
  }
  const selectJob = (id: string) => {
    selectRecoveryJob(id)
    setSelected({})
    setReviews({})
    setRunId('')
    setCancelId('')
    setRejectedPublication(false)
    setPublicationReady(false)
    setFeedback('')
  }
  useEffect(() => {
    if (jobId || createAttempt) return
    if (operationId && selectedOperation.data?.job_id)
      selectOperation(operationId, selectedOperation.data.job_id, {
        replace: true,
      })
    else if (!operationId && jobs.data?.jobs[0])
      selectRecoveryJob(jobs.data.jobs[0].job_id, { replace: true })
  }, [
    jobId,
    createAttempt,
    operationId,
    selectRecoveryJob,
    selectOperation,
    selectedOperation.data?.job_id,
    jobs.data,
  ])
  useEffect(() => {
    if (!persistent || !jobId || operationId || !inbox.data) return
    const original = inbox.data?.operations.find(
      (operation) =>
        operation.job_id === jobId && operation.kind === 'dream_publish',
    )
    const originalId = original?.operation_id || job.data?.analysis_operation_id
    if (originalId) selectOperation(originalId, jobId, { replace: true })
  }, [
    persistent,
    jobId,
    operationId,
    selectOperation,
    inbox.data,
    job.data?.analysis_operation_id,
  ])
  const [targetConflictEpoch, setTargetConflictEpoch] = useState(0)
  const submitCreate = async (command: MemoryMaintenanceCommand) => {
    const current = beginAction()
    setCreateAttempt(command)
    setFeedback('')
    try {
      const result = await create.mutateAsync(command)
      if (!current()) return
      setCreateAttempt(null)
      selectJob(result.job_id)
    } catch (error) {
      if (!current()) return
      if (error instanceof APIError && error.status === 409)
        setTargetConflictEpoch((value) => value + 1)
      setFeedback(
        knownRejection(error)
          ? 'memory.dreaming.conflict'
          : memoryCommandErrorKey(error),
      )
      if (knownRejection(error)) setCreateAttempt(null)
    } finally {
      if (current()) await refresh()
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
      <MemoryDreamingSetup
        memoryId={memoryId}
        capabilities={capabilities}
        busy={busy}
        createPending={create.isPending}
        createAttempt={createAttempt}
        targetConflictEpoch={targetConflictEpoch}
        onCreate={(command) =>
          void submitCreate({ operation_id: commandId(), ...command })
        }
        onRetryCreate={() => {
          if (createAttempt) void submitCreate(createAttempt)
        }}
        onFindCreatedJob={async () => {
          if (!createAttempt) return
          const current = beginAction()
          const result = await jobs.refetch()
          if (!current()) return
          const found = result.data?.jobs.find(
            (item) => item.operation_id === createAttempt.operation_id,
          )
          if (found) {
            setCreateAttempt(null)
            selectJob(found.job_id)
          }
        }}
      />
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
                <MemoryDreamingJobActions
                  memoryId={memoryId}
                  job={job.data}
                  persistent={persistent}
                  busy={busy}
                  runId={runId}
                  onRun={async () => {
                    const operationId =
                      job.data!.analysis_operation_id || runId || commandId()
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
                  onCancel={async () => {
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
                />
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
            <p className="text-xs text-fg-muted">
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
          {operationId && (
            <div className="mt-space-base space-y-space-sm">
              <MemoryOperationPanel
                memoryId={memoryId}
                operationId={operationId}
                poll={persistent}
                onRefresh={() => void refresh()}
                onStatus={publicationStatus}
              />
              {rejectedPublication && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    const current = beginAction()
                    try {
                      await memoryAPI.revision.operation(
                        memoryId,
                        publicationId,
                      )
                      if (!current()) return
                      setFeedback('memory.revisions.inflight')
                    } catch (error) {
                      if (!current()) return
                      if (error instanceof APIError && error.status === 404) {
                        await refresh()
                        if (!current()) return
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
