import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceMarker } from '../ReferenceMarker'

let root: Root
let container: HTMLDivElement

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

describe('ReferenceMarker similarity badge', () => {
  // The similarity colors are light in the dark theme, so a fixed white
  // label is unreadable there; text-inverted flips with the theme.
  it.each([
    [0.92, 'var(--color-text-success)'],
    [0.65, 'var(--color-text-accent)'],
    [0.3, 'var(--color-text-tertiary)'],
  ])(
    'labels %s similarity with inverted text on %s',
    async (similarity, background) => {
      const chunk: ReferenceChunk = {
        id: 'chunk-0',
        content: 'HarnessX 在五个基准上评测。',
        document_id: 'doc-1',
        document_name: 'harness.pdf',
        dataset_id: 'kb-1',
        similarity,
      }
      await act(async () =>
        root.render(<ReferenceMarker index={0} chunk={chunk} />),
      )
      await act(async () =>
        container
          .querySelector<HTMLElement>('[aria-haspopup="dialog"]')
          ?.click(),
      )

      const label = `${Math.round(similarity * 100)}%`
      const badge = [...document.querySelectorAll<HTMLElement>('span')].find(
        (element) => element.textContent === label,
      )
      expect(badge?.style.backgroundColor).toBe(background)
      expect(badge?.style.color).toBe('var(--color-text-inverted)')
      expect(badge?.style.opacity).toBe('')
    },
  )
})
