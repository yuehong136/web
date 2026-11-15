import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import type { MemoryMaintenanceJob } from '@/types/memory-dreaming'

export function MemoryDreamingJob({ job }: { job: MemoryMaintenanceJob }) {
  const { t } = useTranslation()
  return (
    <section className="space-y-space-sm" aria-live="polite">
      <dl className="grid gap-space-sm text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-secondary">{t('memory.dreaming.job')}</dt>
          <dd className="font-mono text-xs break-all">{job.job_id}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">
            {t('memory.dreaming.jobState')}
          </dt>
          <dd>{t(`memory.dreaming.jobStates.${job.state}`)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">{t('memory.dreaming.policy')}</dt>
          <dd>{t(`memory.dreaming.policies.${job.policy}`)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">
            {t('memory.dreaming.estimatedInput')}
          </dt>
          <dd>
            {job.estimated_input_tokens} / {job.input_budget_tokens}
          </dd>
        </div>
      </dl>
      <p className="text-sm">{t('memory.dreaming.coverage', job.coverage)}</p>
      {!!job.coverage.deferred && (
        <Alert variant="warning">{t('memory.dreaming.deferred')}</Alert>
      )}
      {job.state === 'ready' && (
        <Alert variant="info">{t('memory.dreaming.analysisReady')}</Alert>
      )}
      {['running', 'cancel_requested'].includes(job.state) && (
        <Alert variant="warning">{t('memory.dreaming.runningBoundary')}</Alert>
      )}
      {job.analysis_operation_id && (
        <p className="font-mono text-xs break-all">
          {t('memory.dreaming.analysisOperation')}: {job.analysis_operation_id}
        </p>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer">
          {t('memory.dreaming.inputManifest')}
        </summary>
        <ul className="mt-space-sm space-y-space-sm">
          {job.inputs.map((input) => (
            <li key={input.input_id} className="break-all">
              <span className="font-mono">{input.source_id}</span> ·{' '}
              {t(`memory.dreaming.coverageStates.${input.coverage}`)} ·{' '}
              {t('memory.dreaming.sourceVersion', {
                revision: input.source_revision,
                generation: input.source_generation,
              })}
              <p className="font-mono text-text-secondary">
                {input.content_sha256}
              </p>
              {input.defer_reason && (
                <p>{t('memory.dreaming.inputDeferred')}</p>
              )}
            </li>
          ))}
        </ul>
      </details>
      {job.model_reference && (
        <p className="text-xs text-text-secondary">
          {t('memory.dreaming.analysisModel')}: {job.model_reference}
        </p>
      )}
      {!!Object.keys(job.usage).length && (
        <details className="text-xs">
          <summary className="cursor-pointer">
            {t('memory.dreaming.usage')}
          </summary>
          <pre className="mt-space-sm break-all whitespace-pre-wrap">
            {JSON.stringify(job.usage, null, 2)}
          </pre>
        </details>
      )}
    </section>
  )
}
