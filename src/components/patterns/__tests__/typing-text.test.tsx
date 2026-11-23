import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setAppearance } from '@/themes/appearance'
import { TypingText } from '../chat/typing-text'

let root: Root
let host: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  setAppearance({ motion: 'system' })
})

it('reveals the text a few characters at a time and reports completion once', async () => {
  const done = vi.fn()
  await act(async () =>
    root.render(<TypingText text="Hello there" onComplete={done} />),
  )
  expect(host.textContent).toBe('')
  await act(async () => vi.advanceTimersByTime(35))
  expect(host.textContent).toBe('Hell')
  // Each step schedules the next once it has rendered.
  for (let step = 0; step < 4; step++)
    await act(async () => vi.advanceTimersByTime(35))
  expect(host.textContent).toBe('Hello there')
  expect(done).toHaveBeenCalledOnce()
  await act(async () => vi.advanceTimersByTime(500))
  expect(done).toHaveBeenCalledOnce()
})

it('shows the whole text at once when the app setting reduces motion', async () => {
  // The in-app setting, not only the system query, turns typing off.
  setAppearance({ motion: 'reduced' })
  const done = vi.fn()
  await act(async () =>
    root.render(<TypingText text="Hello there" onComplete={done} />),
  )
  expect(host.textContent).toBe('Hello there')
  expect(done).toHaveBeenCalledOnce()
})
