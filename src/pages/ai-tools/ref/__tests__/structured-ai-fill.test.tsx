import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useStructuredAIFill } from '../use-structured-ai-fill'
import { fixtureResponse } from '@/lib/streaming/__tests__/fixtures/structured-chat'
import { toast } from '@/lib/toast'

vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }))
let root: Root
let container: HTMLDivElement
let hook: ReturnType<typeof useStructuredAIFill>
let unmounted: boolean
const loading = vi.fn()
const textEvent = {
  retcode: 0,
  data: { type: 'text', content: '{"name":"fixture"}' },
}
function Harness() {
  const result = useStructuredAIFill(loading)
  useLayoutEffect(() => {
    hook = result
  })
  return <output aria-busy={result.aiFilling}>{result.aiRawOutput}</output>
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  loading.mockClear()
  vi.mocked(toast.error).mockClear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  unmounted = false
  await act(async () => root.render(<Harness />))
})
afterEach(async () => {
  if (!unmounted) await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('only an explicitly completed response can apply generated form fields', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        fixtureResponse([textEvent, { retcode: 0, data: true }]),
      ),
  )
  let result: unknown
  await act(async () => {
    result = await hook.fill({})
  })
  expect(result).toEqual({ name: 'fixture' })
  expect(hook.aiRawOutput).toBe('{"name":"fixture"}')
  expect(hook.aiFilling).toBe(false)
  expect(loading.mock.calls.map(([value]) => value)).toEqual([true, false])
  expect(toast.error).not.toHaveBeenCalled()
})

it.each(['eof', 'error'] as const)(
  'keeps %s output for review and never applies even valid-looking JSON',
  async (outcome) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        fixtureResponse([
          textEvent,
          ...(outcome === 'error'
            ? [
                { retcode: 500, retmsg: 'private-model-detail', data: '' },
                { retcode: 0, data: true },
              ]
            : []),
        ]),
      ),
    )
    let result: unknown
    await act(async () => {
      result = await hook.fill({})
    })
    expect(result).toBeNull()
    expect(hook.aiRawOutput).toBe('{"name":"fixture"}')
    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(vi.mocked(toast.error).mock.calls)).not.toContain(
      'private-model-detail',
    )
    expect(hook.aiFilling).toBe(false)
  },
)

it('malformed completed data is not accepted as form fields', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      fixtureResponse([
        { retcode: 0, data: '{"name":42}' },
        { retcode: 0, data: true },
      ]),
    ),
  )
  let result: unknown
  await act(async () => {
    result = await hook.fill({})
  })
  expect(result).toBeNull()
  expect(toast.error).toHaveBeenCalledTimes(1)
})

it('unmount aborts the owned request and rejects a late successful response', async () => {
  let release!: (response: Response) => void
  let signal: AbortSignal | undefined
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url, init: RequestInit) => {
      signal = init.signal ?? undefined
      return new Promise<Response>((resolve) => {
        release = resolve
      })
    }),
  )
  let pending!: Promise<Record<string, string> | null>
  await act(async () => {
    pending = hook.fill({})
  })
  await act(async () => {
    root.unmount()
    unmounted = true
  })
  expect(signal?.aborted).toBe(true)
  release(fixtureResponse([textEvent, { retcode: 0, data: true }]))
  expect(await pending).toBeNull()
  expect(loading).toHaveBeenLastCalledWith(false)
  expect(toast.error).not.toHaveBeenCalled()
})
