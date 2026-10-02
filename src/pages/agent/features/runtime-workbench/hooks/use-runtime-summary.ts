import { useEffect, useMemo } from 'react'
import { buildRuntimeSummary } from '../utils'
export function useRuntimeSummary(
  {
    status,
    currentView,
    messageCount,
    hasLogs,
    sessionId,
    sessionName,
    lastRunAt,
    lastMessageId,
    lastTaskId,
    lastError,
  }: Parameters<typeof buildRuntimeSummary>[0],
  onSummaryChange?: (summary: ReturnType<typeof buildRuntimeSummary>) => void,
) {
  const summary = useMemo(
    () =>
      buildRuntimeSummary({
        status,
        currentView,
        messageCount,
        hasLogs,
        sessionId,
        sessionName,
        lastRunAt,
        lastMessageId,
        lastTaskId,
        lastError,
      }),
    [
      status,
      currentView,
      messageCount,
      hasLogs,
      sessionId,
      sessionName,
      lastRunAt,
      lastMessageId,
      lastTaskId,
      lastError,
    ],
  )
  useEffect(() => {
    onSummaryChange?.(summary)
  }, [summary, onSummaryChange])
  return summary
}
