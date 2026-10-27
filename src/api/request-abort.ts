/** Expected cancellation, including AbortSignals with a custom reason. */
export const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (('name' in error && error.name === 'AbortError') ||
    ('code' in error && error.code === 'ABORTED'))

/** One timeout/caller owner for the request, including response consumption. */
export const createRequestAbort = (
  timeout: number,
  callerSignal?: AbortSignal | null,
) => {
  const controller = new AbortController()
  let timedOut = false
  const onCallerAbort = () => {
    if (!controller.signal.aborted)
      controller.abort(new DOMException('Aborted', 'AbortError'))
  }
  if (callerSignal?.aborted) onCallerAbort()
  else callerSignal?.addEventListener('abort', onCallerAbort, { once: true })
  const timeoutId = setTimeout(() => {
    if (controller.signal.aborted) return
    timedOut = true
    controller.abort(new DOMException('Timed out', 'TimeoutError'))
  }, timeout)

  const run = <T>(operation: () => Promise<T>): Promise<T> => {
    controller.signal.throwIfAborted()
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => reject(controller.signal.reason)
      controller.signal.addEventListener('abort', onAbort, { once: true })
      const cleanup = () =>
        controller.signal.removeEventListener('abort', onAbort)
      try {
        operation().then(
          (value) => {
            cleanup()
            resolve(value)
          },
          (error) => {
            cleanup()
            reject(error)
          },
        )
      } catch (error) {
        cleanup()
        reject(error)
      }
    })
  }

  return {
    signal: controller.signal,
    run,
    timedOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId)
      callerSignal?.removeEventListener('abort', onCallerAbort)
    },
  }
}
