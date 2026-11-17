import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceDetailSheet } from '../ReferenceDetailSheet'
import { ReferenceMarker } from '../ReferenceMarker'

let root: Root
let container: HTMLDivElement

const filler = '前文铺垫。'.repeat(60)
const chunk: ReferenceChunk = {
  id: 'chunk-0',
  content: `${filler}HarnessX 在五个基准上评测，<b>不是</b>标签。`,
  // The search engine reports matched fragments, not the whole text.
  highlight: '<em>HarnessX</em> 在五个<em>基准</em>上评测',
  document_id: 'doc-1',
  document_name: 'harness.pdf',
  dataset_id: 'kb-1',
}

beforeEach(async () => {
  await setProductLanguage('zh-CN')
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

const marked = (scope: ParentNode | null) =>
  [...(scope?.querySelectorAll('em') ?? [])].map((em) => em.textContent)

describe('matched words in cited chunks', () => {
  it('starts the popover preview at the match and marks it', async () => {
    await act(async () =>
      root.render(<ReferenceMarker index={0} chunk={chunk} />),
    )
    await act(async () =>
      container.querySelector<HTMLButtonElement>('sup > button')?.click(),
    )

    const popover = document.querySelector('[role="dialog"]')
    expect(marked(popover)).toEqual(['HarnessX', '基准'])
    // The match sits past the first 200 characters, so the preview skips
    // ahead rather than showing only the lead-in.
    expect(popover?.textContent).toContain('…')
  })

  it('marks the words across the full text in the detail sheet', async () => {
    await act(async () =>
      root.render(
        <ReferenceDetailSheet
          open
          onOpenChange={() => undefined}
          chunk={{ ...chunk, content: 'HarnessX 的基准，再说一次 harnessx。' }}
        />,
      ),
    )

    expect(marked(document.body)).toEqual(['HarnessX', '基准', 'harnessx'])
  })

  it('keeps chunk text as text, never as markup', async () => {
    await act(async () =>
      root.render(<ReferenceMarker index={0} chunk={chunk} />),
    )
    await act(async () =>
      container.querySelector<HTMLButtonElement>('sup > button')?.click(),
    )

    const popover = document.querySelector('[role="dialog"]')
    expect(popover?.querySelector('b')).toBeNull()
  })
})
