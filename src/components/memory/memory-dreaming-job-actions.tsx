import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { MemoryDreamingJob } from './memory-dreaming-job'
import type { MemoryMaintenanceJob } from '@/types/memory-dreaming'

export function MemoryDreamingJobActions({
  memoryId,
  job,
  persistent,
  busy,
  runId,
  onRun,
  onCancel,
}: {
  memoryId: string
  job: MemoryMaintenanceJob
  persistent: boolean
  busy: boolean
  runId: string
  onRun: () => Promise<void>
  onCancel: () => Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <>
      <MemoryDreamingJob job={job} />
      <div className="flex flex-wrap gap-space-sm">
        <Button
          disabled={
            busy ||
            !['pending', 'failed'].includes(job.state) ||
            (persistent && (!!job.analysis_operation_id || !!runId))
          }
          onClick={() => void onRun()}
        >
          {t(
            persistent
              ? 'memory.recovery.submitAnalysis'
              : 'memory.dreaming.run',
          )}
        </Button>
        <Button
          variant="outline"
          disabled={
            busy ||
            ['canceled', 'redacted', 'stale', 'cancel_requested'].includes(
              job.state,
            )
          }
          onClick={() => void onCancel()}
        >
          {t('memory.dreaming.cancel')}
        </Button>
        {persistent && job.analysis_operation_id && (
          <Button asChild size="sm" variant="outline">
            <Link
              to={`/memory/${encodeURIComponent(memoryId)}/operations?${new URLSearchParams({ operation: job.analysis_operation_id, job: job.job_id })}`}
            >
              {t('memory.recovery.openAnalysisOperation')}
            </Link>
          </Button>
        )}
      </div>
      <p className="text-xs text-text-secondary">
        {t(
          persistent
            ? 'memory.recovery.backgroundBoundary'
            : 'memory.dreaming.explicitRun',
        )}
      </p>
      {runId && runId !== job.analysis_operation_id && (
        <p className="font-mono text-xs break-all">
          {t('memory.dreaming.analysisOperation')}: {runId}
        </p>
      )}
    </>
  )
}
