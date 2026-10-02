import { useCallback } from 'react'
import { useCancelConversation } from '@/hooks/use-agent-request'

export function useStopMessage() {
  const { cancelConversation } = useCancelConversation()

  const stopMessage = useCallback(
    async (taskId?: string) => {
      if (!taskId) {
        return
      }

      await cancelConversation(taskId)
    },
    [cancelConversation],
  )

  return { stopMessage }
}
