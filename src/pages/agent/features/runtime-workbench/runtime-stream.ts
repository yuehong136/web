import { assertSSEResponse, readSSEStream } from '@/lib/streaming'

export const createLocalRuntimeMessageId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Runtime SSE consumption, delegated to the shared streaming runtime
 * (ARCH-1 phase 2). No signal is passed to readSSEStream on purpose: both
 * callers abort via the fetch signal and rely on the resulting AbortError
 * propagating out of this function to enter their STOPPED state.
 */
export async function consumeRuntimeStream(
  response: Response,
  onEvent: (event: unknown) => void,
) {
  await assertSSEResponse(response)
  await readSSEStream(response, { onEvent })
}
