import { useCallback, useLayoutEffect, useRef } from 'react'

/** Fence delayed page actions after their bank or selected job has changed. */
export function useMemoryActionScope(
  memoryId: string,
  jobId: string,
  operationId: string,
) {
  const generation = useRef(0)
  const mounted = useRef(false)
  useLayoutEffect(() => {
    mounted.current = true
    generation.current += 1
    return () => {
      mounted.current = false
      generation.current += 1
    }
  }, [memoryId, jobId, operationId])
  return useCallback(() => {
    const expected = generation.current
    return () => mounted.current && generation.current === expected
  }, [])
}
