import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Only stable resource identities enter the URL; drafts and memory bodies stay out. */
export function useMemoryRecoverySelection() {
  const [params, setParams] = useSearchParams()
  const jobId = params.get('job') ?? ''
  const operationId = params.get('operation') ?? ''
  const selectJob = useCallback(
    (id: string, options?: { replace?: boolean }) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (id) next.set('job', id)
          else next.delete('job')
          next.delete('operation')
          return next
        },
        { replace: options?.replace ?? false },
      )
    },
    [setParams],
  )
  const selectOperation = useCallback(
    (id: string, job?: string, options?: { replace?: boolean }) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (id) next.set('operation', id)
          else next.delete('operation')
          if (job) next.set('job', job)
          return next
        },
        { replace: options?.replace ?? false },
      )
    },
    [setParams],
  )
  return { jobId, operationId, selectJob, selectOperation }
}
