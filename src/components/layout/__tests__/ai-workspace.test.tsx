import { act, useEffect, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AiWorkspace } from '@/components/layout/ai-workspace'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'

vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Panel: ({
    children,
    id,
    defaultSize,
    onResize,
  }: React.PropsWithChildren<{
    id?: string
    defaultSize?: string
    onResize?: (size: { asPercentage: number }) => void
  }>) => {
    if (id === 'ai-workspace-detail') resizeDetail = onResize
    return (
      <div data-panel={id} data-default-size={defaultSize}>
        {children}
      </div>
    )
  },
  Separator: ({ 'aria-label': label }: { 'aria-label': string }) => (
    <div role="separator" aria-label={label} />
  ),
}))

let root: Root
let host: HTMLDivElement
let width = 1400
let mounts = 0
let observers: ResizeObserverCallback[]
let resizeDetail: ((size: { asPercentage: number }) => void) | undefined
function Draft() {
  const [draft, setDraft] = useState('')
  useEffect(() => {
    mounts++
  }, [])
  return (
    <input
      aria-label="Draft"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
    />
  )
}

beforeEach(() => {
  stubChatDOM()
  localStorage.removeItem('ai-workspace-panel-width')
  width = 1400
  mounts = 0
  observers = []
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({
      width,
      height: 900,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 900,
      toJSON() {},
    }),
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        observers.push(callback)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function render(
  open: boolean,
  scopeKey = 'user:thread',
  onOpenChange = vi.fn(),
  returnFocusTargets?: HTMLElement[],
) {
  await act(async () =>
    root.render(
      <AiWorkspace
        open={open}
        onOpenChange={onOpenChange}
        scopeKey={scopeKey}
        detail={<button>Source action</button>}
        detailTitle="Evidence"
        resizeLabel="Resize workspace"
        returnFocusTargets={returnFocusTargets}
      >
        <Draft />
      </AiWorkspace>,
    ),
  )
  return onOpenChange
}

it('keeps the main input mounted through dock, sheet, selection and locale-sized updates', async () => {
  await render(false)
  const input = host.querySelector('input')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, '下一轮草稿')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await render(true)
  expect(host.querySelector('[data-workspace-mode="dock"]')).not.toBeNull()
  expect(host.querySelector('[data-workspace-detail]')).not.toBeNull()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  width = 700
  await act(async () =>
    observers.forEach((callback) => callback([], {} as ResizeObserver)),
  )
  expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  expect(host.querySelector('input')).toBe(input)
  expect(input.value).toBe('下一轮草稿')
  await render(false)
  expect(host.querySelector('input')).toBe(input)
  expect(mounts).toBe(1)
})

it('returns focus after closing a dock and invalidates old-scope resource selection', async () => {
  await render(false)
  const input = host.querySelector('input')!
  input.focus()
  const changed = vi.fn()
  await render(true, 'user:thread', changed)
  ;(
    host.querySelector('[data-workspace-detail] button') as HTMLButtonElement
  ).focus()
  await render(false, 'user:thread', changed)
  expect(document.activeElement).toBe(input)
  await render(true, 'user:thread', changed)
  await render(true, 'other:thread', changed)
  expect(changed).toHaveBeenCalledWith(false)
})

it('retains a resized width when reopening the detail in the same mounted workspace', async () => {
  await render(true)
  await act(async () => resizeDetail!({ asPercentage: 42 }))
  await render(false)
  await render(true)
  expect(
    host
      .querySelector('[data-panel="ai-workspace-detail"]')
      ?.getAttribute('data-default-size'),
  ).toBe('42%')
  expect(localStorage.getItem('ai-workspace-panel-width')).toBe('42')
})

it('returns to the latest resource opener while the dock remains open', async () => {
  const first = document.createElement('button')
  const second = document.createElement('button')
  document.body.append(first, second)
  try {
    await render(true, 'user:thread', vi.fn(), [first])
    await render(true, 'user:thread', vi.fn(), [second])
    await render(false)
    expect(document.activeElement).toBe(second)
  } finally {
    first.remove()
    second.remove()
  }
})
