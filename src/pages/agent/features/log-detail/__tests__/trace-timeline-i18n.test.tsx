import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { TraceTimeline } from '../components/trace-timeline'

let root: Root
let container: HTMLDivElement

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  await setProductLanguage('zh-CN')
})

it.each([
  ['fetching', '正在拉取终态 Trace...', 'Fetching the final Trace...'],
  ['no-message-id', 'message_id', 'no real message_id'],
  ['redis-evicted', 'Redis 中没有返回 Trace', 'Redis returned no Trace'],
  [undefined, '暂无 Trace。', 'No Trace yet.'],
] as const)(
  'explains an empty trace (%s) in the current language',
  async (reason, zh, en) => {
    await act(async () =>
      root.render(<TraceTimeline items={[]} unavailableReason={reason} />),
    )
    expect(container.textContent).toContain(zh)

    await act(async () => setProductLanguage('en-US'))
    expect(container.textContent).toContain(en)
    expect(container.textContent).not.toMatch(/agent\.logDetail\./)
  },
)

it('labels a node without a name in the current language', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(<TraceTimeline items={[{ status: 'success' } as never]} />),
  )
  expect(container.textContent).toContain('Unknown node')
  expect(container.textContent).toContain('success')
})
