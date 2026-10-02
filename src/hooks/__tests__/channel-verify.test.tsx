// @vitest-environment jsdom
import React, { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { channelAPI, type ChannelVerifyResult } from '@/api/channel'
import {
  useVerifyChannel,
  CHANNEL_VERIFY_COOLDOWN_MS,
} from '@/hooks/use-channel-request'

let root: Root
let container: HTMLDivElement
let verify: ReturnType<typeof useVerifyChannel>
function VerifyProbe() {
  const value = useVerifyChannel()
  useLayoutEffect(() => {
    verify = value
  })
  return <output>{String(value.coolingDown)}</output>
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers()
  vi.setSystemTime(14 * 24 * 3600_000)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
})
async function mountVerify() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <VerifyProbe />
      </QueryClientProvider>,
    ),
  )
}
it.each([true, false])(
  'expires the cooldown after a settled verification (success=%s)',
  async (success) => {
    const request = vi.spyOn(channelAPI, 'verify')
    if (success)
      request.mockResolvedValue({ ok: true } as unknown as ChannelVerifyResult)
    else request.mockRejectedValue(new Error('provider unavailable'))
    await mountVerify()
    expect(container.textContent).toBe('false')
    await act(async () => {
      await verify.mutateAsync('channel').catch(() => undefined)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(request.mock.calls[0]?.[0]).toBe('channel')
    expect(container.textContent).toBe('true')
    await act(async () =>
      vi.advanceTimersByTimeAsync(CHANNEL_VERIFY_COOLDOWN_MS - 1),
    )
    expect(container.textContent).toBe('true')
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(container.textContent).toBe('false')
  },
)
