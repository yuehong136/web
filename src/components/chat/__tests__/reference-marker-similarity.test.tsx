import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n, { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceDetailSheet } from '../ReferenceDetailSheet'
import { ReferenceMarker } from '../ReferenceMarker'

let root: Root
let container: HTMLDivElement

const chunkWith = (similarity?: number): ReferenceChunk => ({
  id: 'chunk-0',
  content: 'HarnessX 在五个基准上评测。',
  document_id: 'doc-1',
  document_name: 'harness.pdf',
  dataset_id: 'kb-1',
  similarity,
})

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

describe('reference retrieval score placement', () => {
  // 评分只说明检索阶段的排序，浮层是阅读时的快速预览，不再放彩色评分徽标
  it.each([0, 0.92, 0.65, 0.3])(
    'keeps the %s score out of the citation popover',
    async (similarity) => {
      await act(async () =>
        root.render(
          <ReferenceMarker index={0} chunk={chunkWith(similarity)} />,
        ),
      )
      await act(async () =>
        container.querySelector<HTMLButtonElement>('sup > button')?.click(),
      )

      const popover = document.querySelector('[role="dialog"]')
      expect(popover?.textContent).toContain('harness.pdf')
      expect(popover?.textContent).not.toContain('%')
    },
  )

  // 诊断区分值用随主题翻转的文字令牌，不再是固定白字压在三档彩色底上；
  // 0 是真实评分，照常显示为 0%
  it.each([0, 0.92, 0.65, 0.3])(
    'labels the %s score in the sheet diagnostics with theme text tokens',
    async (similarity) => {
      await act(async () =>
        root.render(
          <ReferenceDetailSheet
            open
            onOpenChange={() => undefined}
            chunk={chunkWith(similarity)}
          />,
        ),
      )

      const label = `${Math.round(similarity * 100)}%`
      const value = [...document.querySelectorAll('dd')].find(
        (element) => element.textContent === label,
      )
      expect(value?.className).toContain('text-text-primary')
      expect(value?.getAttribute('style')).toBeNull()
    },
  )

  it.each([undefined, NaN, Infinity, -0.1, 1.1])(
    'does not invent zero relevance for %s',
    async (similarity) => {
      const chunk: ReferenceChunk = {
        ...chunkWith(similarity),
        content: 'Excerpt',
        document_id: 'doc/with space',
        document_name: '',
      }
      await act(async () =>
        root.render(<ReferenceMarker index={0} chunk={chunk} />),
      )
      await act(async () =>
        container.querySelector<HTMLButtonElement>('sup button')!.click(),
      )
      const popup = document.querySelector<HTMLElement>('[role="dialog"]')!
      expect(popup.textContent).not.toMatch(/(?:NaN|Infinity|0)%/)
      expect(popup.textContent).toContain(i18n.t('sources.unknownDocument'))
      const link = popup.querySelector('a')!
      expect(link.getAttribute('href')).toContain(
        '/document/doc%2Fwith%20space/preview',
      )
      expect(link.rel).toBe('noopener noreferrer')

      await act(async () =>
        root.render(
          <ReferenceDetailSheet
            open
            onOpenChange={() => undefined}
            chunk={chunk}
          />,
        ),
      )
      const sheet = document.querySelector<HTMLElement>('[role="dialog"]')!
      expect(sheet.textContent).toContain(
        i18n.t('reference.diagnostics.unavailable'),
      )
      expect(sheet.textContent).not.toMatch(/(?:NaN|Infinity|0)%/)
    },
  )
})
