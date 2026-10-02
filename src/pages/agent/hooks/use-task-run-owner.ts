import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'

export interface TaskRunAttempt {
  controller: AbortController
  taskId?: string
  assistantId?: string
  active: boolean
  stopRequested: boolean
}

/** The task ID and asynchronous feedback belong to one attempt in one canvas. */
export function useTaskRunOwner(canvasId?: string) {
  const current = useRef<TaskRunAttempt | null>(null)
  const scope = useRef(canvasId)
  const mounted = useRef(true)
  const reset = useCallback(() => {
    current.current?.controller.abort()
    current.current = null
  }, [])
  useLayoutEffect(() => {
    if (scope.current !== canvasId) reset()
    scope.current = canvasId
  }, [canvasId, reset])
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      reset()
    }
  }, [reset])
  const owns = useCallback(
    (attempt: TaskRunAttempt) => mounted.current && current.current === attempt,
    [],
  )
  const begin = useCallback(() => {
    reset()
    const attempt: TaskRunAttempt = {
      controller: new AbortController(),
      active: true,
      stopRequested: false,
    }
    current.current = attempt
    return attempt
  }, [reset])
  const finish = useCallback(
    (attempt: TaskRunAttempt) => {
      if (owns(attempt)) attempt.active = false
    },
    [owns],
  )
  const requestStop = useCallback(() => {
    const attempt = current.current
    if (!attempt || !attempt.active || attempt.stopRequested) return null
    attempt.stopRequested = true
    attempt.active = false
    return attempt
  }, [])
  return useMemo(
    () => ({ current, begin, owns, finish, reset, requestStop }),
    [begin, owns, finish, reset, requestStop],
  )
}
