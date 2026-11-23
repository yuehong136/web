import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import type { MemoryBackgroundExecution } from '@/types/memory-revisions'

export function MemoryExecutionStatus({
  execution,
}: {
  execution?: MemoryBackgroundExecution | null
}) {
  const { t } = useTranslation()
  if (!execution) return null
  const attention =
    execution.needs_operator_reconciliation ||
    execution.state === 'needs_reconciliation'
  return (
    <Alert
      variant={attention || execution.state === 'failed' ? 'warning' : 'info'}
      className="space-y-space-xs"
      aria-live="polite"
    >
      <p className="text-sm font-medium">
        {t(`memory.recovery.executionStates.${execution.state}`)}
      </p>
      <p className="text-xs">
        {t(
          attention
            ? 'memory.recovery.operatorRequired'
            : `memory.recovery.executionHints.${execution.state}`,
        )}
      </p>
      <p className="text-xs">
        {t('memory.recovery.executionAttempt', { count: execution.attempt })}
      </p>
    </Alert>
  )
}
