import { MemoryFragmentProvenance } from './memory-fragment-provenance'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Link } from 'react-router-dom'
import type {
  MemoryCandidateReview,
  MemoryMaintenanceCandidate,
} from '@/types/memory-dreaming'

export function MemoryDreamingCandidate({
  candidate,
  selected,
  selectionDisabled,
  busy,
  retainedReview,
  onSelect,
  onReview,
}: {
  candidate: MemoryMaintenanceCandidate
  selected: boolean
  selectionDisabled: boolean
  busy: boolean
  retainedReview?: MemoryCandidateReview
  onSelect: (selected: boolean) => void
  onReview: (decision: 'approve' | 'reject') => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const redacted =
    candidate.redacted || ['stale', 'redacted'].includes(candidate.state)
  const reviewable =
    !redacted && ['pending', 'approved', 'rejected'].includes(candidate.state)
  const selectable =
    !redacted && candidate.state === 'approved' && candidate.action !== 'noop'
  return (
    <article className="min-w-0 space-y-space-base rounded-radius-lg border border-border-default bg-background-surface p-space-base">
      <div className="flex flex-wrap items-start justify-between gap-space-sm">
        <div className="space-y-space-xs">
          <h3 className="text-sm font-medium">
            {t(`memory.dreaming.actions.${candidate.action}`)} ·{' '}
            {t(`memory.dreaming.candidateStates.${candidate.state}`)}
          </h3>
          <p className="flex min-w-0 flex-col gap-space-xs text-xs">
            <span className="font-mono break-all">
              {candidate.candidate_id}
            </span>
            <span className="text-text-secondary">
              {t('memory.dreaming.candidateRevision', {
                revision: candidate.revision,
              })}
            </span>
          </p>
        </div>
        {selectable && (
          <div className="flex items-center gap-space-sm">
            <Checkbox
              id={id}
              checked={selected}
              disabled={selectionDisabled}
              onCheckedChange={(value) => onSelect(value === true)}
            />
            <Label htmlFor={id}>{t('memory.dreaming.selectPublication')}</Label>
          </div>
        )}
      </div>
      <p className="text-xs text-text-secondary">
        {t('memory.dreaming.assessment')}: {candidate.assessment.kind} /{' '}
        {candidate.assessment.verification_status}
      </p>
      {candidate.target_entry_id && (
        <p className="text-xs break-all">
          {t('memory.dreaming.targetEntry')}: {candidate.target_entry_id} ·{' '}
          {t('memory.dreaming.targetRevision', {
            revision: candidate.expected_revision,
          })}
        </p>
      )}
      {redacted ? (
        <Alert variant="warning">{t('memory.dreaming.redacted')}</Alert>
      ) : (
        <>
          {candidate.diff ? (
            <div className="grid gap-space-sm md:grid-cols-2">
              {(['old_text', 'new_text'] as const).map((field) => (
                <div key={field} className="min-w-0 space-y-space-xs">
                  <h4 className="text-xs font-medium">
                    {t(`memory.dreaming.${field}`)}
                  </h4>
                  <pre className="rounded-radius-md bg-background-subtle p-space-sm text-sm break-words whitespace-pre-wrap">
                    {candidate.diff![field]}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            candidate.content !== null && (
              <pre className="rounded-radius-md bg-background-subtle p-space-sm text-sm break-words whitespace-pre-wrap">
                {candidate.content}
              </pre>
            )
          )}
          {candidate.reason && (
            <p className="text-sm text-text-secondary">{candidate.reason}</p>
          )}
        </>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer">
          {t('memory.dreaming.provenance', { count: candidate.sources.length })}
        </summary>
        <ul className="mt-space-sm space-y-space-sm">
          {candidate.sources.map((source) => (
            <li key={source.input_id} className="min-w-0 space-y-space-xs">
              <p className="min-w-0 space-y-space-xs">
                <span className="block">
                  {t('memory.revisions.source')}{' '}
                  <span className="font-mono break-all">
                    {source.source_id}
                  </span>
                </span>
                <span className="block text-text-secondary">
                  {t('memory.dreaming.sourceVersion', {
                    revision: source.source_revision,
                    generation: source.source_generation,
                  })}
                </span>
              </p>
              <p className="min-w-0 text-text-secondary">
                {source.fragment && (
                  <span className="block">
                    {t('memory.segments.wholeHash')}
                  </span>
                )}
                <span className="block font-mono break-all">
                  {source.content_sha256}
                </span>
              </p>
              <MemoryFragmentProvenance fragment={source.fragment} />
            </li>
          ))}
        </ul>
      </details>
      {candidate.publication_operation_id && (
        <p className="text-xs break-all">
          {t('memory.revisions.operation')}:{' '}
          <Link
            className="underline underline-offset-2"
            to={`../operations?${new URLSearchParams({ operation: candidate.publication_operation_id })}`}
          >
            {candidate.publication_operation_id}
          </Link>
        </p>
      )}
      {retainedReview && (
        <Alert variant="warning">
          <p>{t('memory.dreaming.reviewUnknown')}</p>
          <p className="font-mono text-xs break-all">
            {retainedReview.operation_id}
          </p>
        </Alert>
      )}
      {reviewable && (
        <div className="flex gap-space-sm">
          {retainedReview ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onReview(retainedReview.decision)}
            >
              {t('memory.dreaming.retryReview')}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  busy ||
                  candidate.action === 'noop' ||
                  candidate.state === 'approved'
                }
                onClick={() => onReview('approve')}
              >
                {t('memory.dreaming.approve')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy || candidate.state === 'rejected'}
                onClick={() => onReview('reject')}
              >
                {t('memory.dreaming.reject')}
              </Button>
            </>
          )}
        </div>
      )}
    </article>
  )
}
