import { act, StrictMode, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceDetailSheet } from '../ReferenceDetailSheet'
import { ReferenceMarker } from '../ReferenceMarker'

const chunk: ReferenceChunk = {
  id: 'chunk-0',
  content: 'HarnessX 在五个基准上评测。',
  document_id: 'doc-1',
  document_name: 'harness.html',
  dataset_id: 'kb-1',
}

let root: Root
let container: HTMLDivElement

// Radix restores focus in a timeout after the content unmounts.
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]')
const press = (key: string) =>
  act(async () => {
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true }),
    )
  })

// Callers open the sheet through state, never through a Dialog.Trigger.
function Sources() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        chunk
      </button>
      <ReferenceDetailSheet open={open} onOpenChange={setOpen} chunk={chunk} />
    </>
  )
}

function Citation() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <p>
        HarnessX
        <ReferenceMarker
          index={0}
          chunk={chunk}
          onViewDetail={() => setOpen(true)}
        />
      </p>
      <ReferenceDetailSheet open={open} onOpenChange={setOpen} chunk={chunk} />
    </>
  )
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('ReferenceDetailSheet focus return', () => {
  it('returns focus to the button that opened it after Escape', async () => {
    await act(async () =>
      root.render(
        <StrictMode>
          <Sources />
        </StrictMode>,
      ),
    )
    const opener = container.querySelector('button')!
    opener.focus()
    await act(async () => opener.click())
    await settle()
    expect(sheet()?.contains(document.activeElement)).toBe(true)

    await press('Escape')
    await settle()

    expect(sheet()).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('falls back to the citation marker once its popover 详情 button is gone', async () => {
    await act(async () =>
      root.render(
        <StrictMode>
          <Citation />
        </StrictMode>,
      ),
    )
    const marker = container.querySelector<HTMLButtonElement>('sup > button')!
    marker.focus()
    await act(async () => marker.click())
    await settle()
    expect(marker.getAttribute('aria-expanded')).toBe('true')

    const detail = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
    ).find((button) => button.textContent?.includes('详情'))!
    detail.focus()
    await act(async () => detail.click())
    await settle()
    expect(detail.isConnected).toBe(false)
    expect(sheet()?.contains(document.activeElement)).toBe(true)

    await press('Escape')
    await settle()

    expect(sheet()).toBeNull()
    expect(document.activeElement).toBe(marker)
  })
})
