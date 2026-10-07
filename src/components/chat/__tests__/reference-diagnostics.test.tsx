import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceDetailSheet } from '../ReferenceDetailSheet'

const baseChunk: ReferenceChunk = {
  id: 'chunk-0',
  content: 'HarnessX 在五个基准上评测。',
  document_id: 'doc-1',
  document_name: 'harness.html',
  dataset_id: 'kb-1',
}

let root: Root
let container: HTMLDivElement

const diagnostics = () =>
  document.querySelector<HTMLElement>(
    '[role="dialog"] section[aria-labelledby]',
  )
const scoreValue = () => diagnostics()?.querySelector('dd')?.textContent
const scoreBar = () =>
  diagnostics()?.querySelector('.bg-components-progress-fill')

async function renderSheet(
  chunk: ReferenceChunk,
  allChunks?: ReferenceChunk[],
) {
  await act(async () =>
    root.render(
      <ReferenceDetailSheet
        open
        onOpenChange={() => undefined}
        chunk={chunk}
        allChunks={allChunks}
      />,
    ),
  )
}

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

describe('ReferenceDetailSheet retrieval diagnostics', () => {
  it.each<[string, unknown]>([
    ['missing', undefined],
    ['null', null],
    ['NaN', Number.NaN],
    ['a numeric string', '0.8'],
    ['above 1', 1.5],
    ['negative', -0.1],
  ])('shows a %s score as unavailable, never as 0%%', async (_, similarity) => {
    await renderSheet({
      ...baseChunk,
      similarity: similarity as number | undefined,
    })

    expect(diagnostics()?.querySelector('h3')?.textContent).toBe('检索诊断')
    expect(diagnostics()?.textContent).toContain('检索匹配评分')
    expect(scoreValue()).toBe('不可用')
    expect(diagnostics()?.textContent).not.toContain('0%')
    expect(scoreBar()).toBeFalsy()
  })

  it.each([
    [0, '0%'],
    [0.82, '82%'],
    [1, '100%'],
  ])('shows a usable %s score as %s with a bar', async (similarity, label) => {
    await renderSheet({ ...baseChunk, similarity })

    expect(scoreValue()).toBe(label)
    expect(scoreBar()).toBeTruthy()
  })

  // 知识库设了 PageRank 等排序加权时综合分会超过 1：仍不按百分比显示，但写出原始值
  it('keeps an out-of-range number unavailable while writing out its raw value', async () => {
    await renderSheet({ ...baseChunk, similarity: 10.60724 })
    expect(scoreValue()).toBe('不可用')
    expect(scoreBar()).toBeFalsy()
    expect(diagnostics()?.textContent).toContain('原始值 10.607 超出 0–1')

    for (const similarity of [Number.NaN, '0.8', undefined]) {
      await renderSheet({
        ...baseChunk,
        similarity: similarity as number | undefined,
      })
      expect(diagnostics()?.textContent).not.toContain('原始值')
    }
  })

  it('lists only usable sub-scores, keeping a real zero', async () => {
    await renderSheet({
      ...baseChunk,
      similarity: 0.6,
      vector_similarity: 0,
      term_similarity: null as unknown as number,
    })
    expect(diagnostics()?.textContent).toContain('向量匹配0%')
    expect(diagnostics()?.textContent).not.toContain('词汇匹配')

    await renderSheet({
      ...baseChunk,
      similarity: 0.6,
      vector_similarity: 'x' as unknown as number,
      term_similarity: 2,
    })
    expect(diagnostics()?.textContent).not.toContain('向量匹配')
    expect(diagnostics()?.textContent).not.toContain('词汇匹配')
  })

  it('renders metadata-only references without inventing a score', async () => {
    await renderSheet({
      ...baseChunk,
      document_metadata: { author: '张三', year: 2026 },
    })

    const dialog = document.querySelector('[role="dialog"]')!
    expect(
      [...dialog.querySelectorAll('h3')].map((h) => h.textContent),
    ).toEqual(['内容', '文档元数据', '检索诊断'])
    expect(dialog.textContent).toContain('author: 张三')
    expect(dialog.textContent).toContain('year: 2026')
    expect(scoreValue()).toBe('不可用')
  })

  it('renders score-only references without an empty metadata section', async () => {
    await renderSheet({ ...baseChunk, similarity: 0.7 })

    const headings = [...document.querySelectorAll('[role="dialog"] h3')].map(
      (heading) => heading.textContent,
    )
    expect(headings).toEqual(['内容', '检索诊断'])
    expect(scoreValue()).toBe('70%')
  })

  it('shows raw position data or says there is none, never a page number', async () => {
    await renderSheet({ ...baseChunk, positions: [[2, 1, 1, 1, 1]] })
    expect(diagnostics()?.textContent).toContain('定位数据[[2,1,1,1,1]]')
    expect(diagnostics()?.textContent).not.toContain('页')

    await renderSheet({ ...baseChunk, positions: [] })
    expect(diagnostics()?.textContent).toContain('无定位数据')
  })

  it('skips empty or non-string IDs such as a web result knowledge base', async () => {
    await renderSheet({
      ...baseChunk,
      dataset_id: [] as unknown as string,
      image_id: '',
    })

    expect(diagnostics()?.textContent).toContain('切片 ID')
    expect(diagnostics()?.textContent).not.toContain('知识库 ID')
    expect(diagnostics()?.textContent).not.toContain('图片 ID')
    expect(
      diagnostics()?.querySelector('button[aria-label="复制切片 ID"]'),
    ).toBeTruthy()
  })

  it('keeps scores out of the other citations from the same document', async () => {
    const related: ReferenceChunk = {
      ...baseChunk,
      id: 'chunk-1',
      content: '同文档的另一段。',
      similarity: 0.9,
    }
    await renderSheet({ ...baseChunk, similarity: 0.5 }, [baseChunk, related])

    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain('同文档其他引用（1）')
    expect(dialog.textContent).not.toContain('90%')
  })

  it('renders the sheet in English', async () => {
    await setProductLanguage('en-US')
    await renderSheet({
      ...baseChunk,
      content: 'HarnessX was evaluated on five benchmarks.',
      document_name: '',
      document_metadata: { author: 'Zhang' },
    })

    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.querySelector('h2')?.textContent).toBe('Unknown document')
    expect(dialog.textContent).toContain('View source')
    expect(dialog.textContent).toContain('Document metadata')
    expect(diagnostics()?.querySelector('h3')?.textContent).toBe(
      'Retrieval diagnostics',
    )
    expect(diagnostics()?.textContent).toContain('Retrieval match score')
    expect(scoreValue()).toBe('Unavailable')
    expect(diagnostics()?.textContent).toContain('No position data')
    expect(dialog.textContent).not.toMatch(/[一-鿿]/)
  })
})
