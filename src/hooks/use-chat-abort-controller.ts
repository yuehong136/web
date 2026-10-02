import { useCallback, useRef } from 'react'

export function useChatAbortController() {
  const controller = useRef<AbortController | null>(null)
  const createController = useCallback(() => {
    const next = new AbortController()
    controller.current = next
    return next
  }, [])
  const abort = useCallback(() => {
    controller.current?.abort()
    controller.current = null
  }, [])
  return { createController, abort }
}
