import { useCallback, useEffect } from 'react'

export function useStopMessage() {
  const stopMessage = useCallback((taskId?: string) => {
    if (taskId) {
      // TODO: Implement cancel conversation API
      console.log('Stopping message with taskId:', taskId)
    }
  }, [])

  return { stopMessage }
}

export function useStopMessageUnmount(chatVisible: boolean, taskId?: string) {
  const { stopMessage } = useStopMessage()

  const handleBeforeUnload = useCallback(() => {
    if (chatVisible) {
      stopMessage(taskId)
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
