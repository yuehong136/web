import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { extractReferencesFromSSEData } from '@/utils/reference-replacer'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { createReferenceMarkerComponent } from '../ReferenceMarker'

// [ID:n] 解析到哪个片段：数组按位置；keyed map 只按 reference_index 精确匹配

let root: Root
let container: HTMLDivElement

const chunk = (index: number, document_name: string): ReferenceChunk => ({
  id: `chunk-${index}`,
  content: `片段 ${index}`,
  document_id: `doc-${index}`,
  document_name,
  dataset_id: 'kb-1',
})

const renderCitations = (references: ReferenceChunk[], ids: string[]) => {
  const Sup = createReferenceMarkerComponent(references)
  return act(async () =>
    root.render(
      <p>
        {ids.map((id) => (
          <Sup key={id}>{id}</Sup>
        ))}
      </p>,
    ),
  )
}

const resolved = () =>
  [...container.querySelectorAll('sup')].map(
    (sup) =>
      sup.querySelector('button')?.getAttribute('aria-label') ??
      `plain ${sup.textContent}`,
  )

beforeEach(async () => {
  await setProductLanguage('zh-CN')
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

it('resolves array citations by position', async () => {
  await renderCitations(
    [chunk(0, 'zero.pdf'), chunk(1, 'one.pdf')],
    ['1', '0', '2'],
  )

  expect(resolved()).toEqual(['引用 2：one.pdf', '引用 1：zero.pdf', 'plain 3'])
})

it('resolves keyed citations only by their key, never by position', async () => {
  // 键缺号（0、2、5）：[ID:1] 没有对应片段，不能退回到第 2 个位置上的 two.pdf
  const references = extractReferencesFromSSEData({
    reference: {
      chunks: {
        '5': chunk(5, 'five.pdf'),
        '0': chunk(0, 'zero.pdf'),
        '2': chunk(2, 'two.pdf'),
      },
    },
  })
  await renderCitations(references, ['0', '1', '5'])

  const [zero, missing, five] = resolved()
  expect(zero).toContain('zero.pdf')
  expect(missing.startsWith('plain')).toBe(true)
  expect(five).toContain('five.pdf')
})
