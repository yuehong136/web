import { useTranslation } from 'react-i18next'
import {
  AnswerRecoveryActions,
  ChatAnswerStatus,
} from '@/components/patterns/chat/chat-answer-status'
import type { AnswerStatusKind } from '@/lib/chat/answer-status'
import { getRunPhaseNotice, type RunPhase } from '@/lib/streaming'

/** Explore records run phases, not error categories; map them for tone. */
const PHASE_KIND: Partial<Record<RunPhase, AnswerStatusKind>> = {
  failed: 'failed',
  interrupted: 'unconfirmed',
  locallyStopped: 'stopped',
  serverCancelled: 'stopped',
  cancelRequested: 'stopped',
}

/**
 * Why an Explore answer did not finish, in the same notice Home uses, with
 * a retry that regenerates the answer once the run has ended.
 */
export function ExploreRunNotice({
  phase,
  onRetry,
}: {
  phase?: RunPhase
  onRetry?: () => void
}) {
  const { t } = useTranslation()
  const key = phase ? getRunPhaseNotice(phase) : null
  const kind = phase ? PHASE_KIND[phase] : undefined
  if (!key || !kind) return null
  return (
    <div data-run-notice={phase}>
      <ChatAnswerStatus
        kind={kind}
        title={t(key)}
        actions={
          onRetry && phase !== 'cancelRequested' ? (
            <AnswerRecoveryActions kind={kind} onRetry={onRetry} />
          ) : undefined
        }
      />
    </div>
  )
}
