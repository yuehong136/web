import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ReferencePanel } from '../ReferencePanel'

const chunk = (overrides: Partial<ReferenceChunk>): ReferenceChunk => ({
  id: 'chunk-0',
  content: 'HarnessX 在五个基准上评测。',
  document_id: 'doc-1',
  document_name: 'harness.html',
  dataset_id: 'kb-1',
  ...overrides,
})

const chunks = [
  chunk({ id: 'a' }),
  chunk({ id: 'b', similarity: 0, doc_type: 'table' }),
  chunk({ id: 'c', similarity: 0.9, document_metadata: { author: '张三' } }),
  chunk({
    id: 'd',
    document_id: 'doc-2',
    document_name: '',
    similarity: 0.4,
  }),
]

let root: Root
let container: HTMLDivElement

const toggle = (text: string) =>
  [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
    button.textContent?.includes(text),
  )!

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

describe('ReferencePanel', () => {
  it('lists sources without retrieval scores, missing or not', async () => {
    const onChunkClick = vi.fn()
    await act(async () =>
      root.render(
        <ReferencePanel chunks={chunks} onChunkClick={onChunkClick} />,
      ),
    )

    const header = toggle('引用来源')
    expect(header.type).toBe('button')
    expect(header.getAttribute('aria-expanded')).toBe('false')
    expect(header.textContent).toContain('2 个文档 · 4 条引用')

    await act(async () => header.click())
    expect(header.getAttribute('aria-expanded')).toBe('true')
    expect(container.textContent).not.toContain('%')
    expect(container.textContent).toContain('未知文档')
    expect(container.textContent).toContain('表格')

    const more = toggle('查看更多')
    expect(more.textContent).toContain('查看更多（1 条）')
    expect(more.getAttribute('aria-expanded')).toBe('false')
    await act(async () => more.click())
    expect(more.getAttribute('aria-expanded')).toBe('true')
    expect(container.textContent).toContain('author: 张三')
    expect(container.textContent).not.toContain('%')

    await act(async () => toggle('表格').click())
    expect(onChunkClick).toHaveBeenCalledWith(chunks[1])
  })

  it('localizes headings, counts and labels to English', async () => {
    await setProductLanguage('en-US')
    const english = chunks.map((item) => ({
      ...item,
      content: 'HarnessX was evaluated on five benchmarks.',
      document_metadata: undefined,
    }))
    await act(async () =>
      root.render(<ReferencePanel chunks={english.slice(3)} defaultExpanded />),
    )

    expect(toggle('Sources').textContent).toContain('1 document · 1 citation')
    expect(container.textContent).toContain('Unknown document')
    expect(container.textContent).toContain('Text')

    await act(async () => root.render(<ReferencePanel chunks={english} />))
    expect(toggle('Sources').textContent).toContain('2 documents · 4 citations')
    expect(toggle('Show 1 more').getAttribute('aria-expanded')).toBe('false')
    expect(container.textContent).not.toMatch(/[一-鿿]/)
  })
})
