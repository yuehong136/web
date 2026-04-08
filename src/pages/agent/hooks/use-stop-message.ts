import { useCallback, useEffect } from 'react'
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

export function useStopMessageUnmount(chatVisible: boolean, taskId?: string) {
  const { stopMessage } = useStopMessage()

  const handleBeforeUnload = useCallback(() => {
    if (chatVisible) {
      void stopMessage(taskId)
    }
  }, [chatVisible, stopMessage, taskId])

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [handleBeforeUnload])

  return { stopMessage }
}
