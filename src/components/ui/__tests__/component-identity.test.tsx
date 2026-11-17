import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Spinner } from '@/components/ui/spinner'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('keeps the loading animation node when its parent updates', async () => {
  await act(async () => root.render(<Spinner label="first" />))
  const ring = container.querySelector('.animate-spin')
  expect(ring).not.toBeNull()
  await act(async () => root.render(<Spinner label="next" />))
  expect(container.querySelector('.animate-spin')).toBe(ring)
  expect(container.textContent).toBe('next')
  expect(container.querySelector('[role="status"]')).not.toBeNull()
})
