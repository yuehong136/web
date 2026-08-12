import { useCallback } from 'react'
import { useCancelConversation } from '@/hooks/use-agent-request'

export function useStopMessage() {
  const { cancelConversation } = useCancelConversation()

  const stopMessage = useCallback(
    async (taskId?: string) => {
      if (!taskId) {
        return
      }

      try {
        await cancelConversation(taskId)
      } catch {
        // The runtime workbench already handles the local aborted state.
      }
    },
    [cancelConversation],
  )

  return { stopMessage }
}
