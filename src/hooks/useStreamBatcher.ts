import { useCallback, useEffect, useRef } from 'react'

interface StreamBatcherOptions {
  maxDelayMs?: number
}

interface StreamBatcherResult<T extends Record<string, unknown>> {
  schedulePatch: (patch: Partial<T>) => void
  flush: () => void
  reset: () => void
}

export function useStreamBatcher<T extends Record<string, unknown>>(
  applyPatch: (patch: Partial<T>) => void,
  options: StreamBatcherOptions = {}
): StreamBatcherResult<T> {
  const { maxDelayMs = 33 } = options
  const pendingPatchRef = useRef<Partial<T> | null>(null)
  const frameRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSchedulers = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const flush = useCallback(() => {
    clearSchedulers()
    const pendingPatch = pendingPatchRef.current
    if (!pendingPatch) return
    pendingPatchRef.current = null
    applyPatch(pendingPatch)
  }, [applyPatch, clearSchedulers])

  const schedulePatch = useCallback(
    (patch: Partial<T>) => {
      pendingPatchRef.current = pendingPatchRef.current
        ? { ...pendingPatchRef.current, ...patch }
        : patch

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null
          flush()
        })
      }

      if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null
          flush()
        }, maxDelayMs)
      }
    },
    [flush, maxDelayMs]
  )

  const reset = useCallback(() => {
    clearSchedulers()
    pendingPatchRef.current = null
  }, [clearSchedulers])

  useEffect(() => {
    return () => {
      clearSchedulers()
      pendingPatchRef.current = null
    }
  }, [clearSchedulers])

  return {
    schedulePatch,
    flush,
    reset,
  }
}
