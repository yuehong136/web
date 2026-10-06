import { useCallback, useRef, useState } from 'react'

/**
 * Single-flight gate for a user submit. `run` claims the gate synchronously,
 * so a second submit in the same tick (double click, repeated Enter) is
 * rejected before any React state has re-rendered. It returns `false` when
 * rejected, otherwise the task's promise; the gate reopens once it settles.
 */
export function useSubmitGate() {
  const lockedRef = useRef(false)
  const [isPending, setIsPending] = useState(false)

  const run = useCallback(
    (task: () => Promise<void>): Promise<void> | false => {
      if (lockedRef.current) return false
      lockedRef.current = true
      setIsPending(true)
      return task().finally(() => {
        lockedRef.current = false
        setIsPending(false)
      })
    },
    [],
  )

  return { isPending, run }
}
