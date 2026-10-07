import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceDetailSheet } from '../ReferenceDetailSheet'
import { ReferenceMarker } from '../ReferenceMarker'
import { getOriginalSource } from '../reference-meta'

const documentChunk: ReferenceChunk = {
  id: 'chunk-0',
  content: 'HarnessX 在五个基准上评测。',
  document_id: 'doc 1/2',
  document_name: 'harness.pdf',
  dataset_id: 'kb-1',
}

// 联网检索结果：知识库 ID 为空数组，文档 ID 是临时值，只有来源网页可打开
const webChunk: ReferenceChunk = {
  ...documentChunk,
  id: 'web-0',
  document_id: 'f3a1e2c4',
  document_name: 'HarnessX - arXiv',
  dataset_id: [] as unknown as string,
  url: 'https://arxiv.org/abs/2606.14249',
}

let root: Root
let container: HTMLDivElement

const button = (scope: ParentNode, text: string) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent?.trim() === text,
  )

async function openPopover(chunk: ReferenceChunk) {
  await act(async () =>
    root.render(<ReferenceMarker index={0} chunk={chunk} />),
  )
  await act(async () =>
    container.querySelector<HTMLButtonElement>('sup > button')!.click(),
  )
  return document.querySelector<HTMLElement>('[role="dialog"]')!
}

async function openSheet(chunk: ReferenceChunk) {
  await act(async () =>
    root.render(
      <ReferenceDetailSheet
        open
        onOpenChange={() => undefined}
        chunk={chunk}
      />,
    ),
  )
  return document.querySelector<HTMLElement>('[role="dialog"]')!
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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('getOriginalSource', () => {
  it('previews knowledge base documents and opens web results at their page', () => {
    expect(getOriginalSource(documentChunk)).toEqual({
      kind: 'document',
      documentId: 'doc 1/2',
      documentName: 'harness.pdf',
    })
    expect(getOriginalSource(webChunk)).toEqual({
      kind: 'web',
      url: 'https://arxiv.org/abs/2606.14249',
    })
  })

  it('offers no source for unsafe or missing links and graph summaries', () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,<p>x</p>',
      'ftp://example.com/a',
      'not a url',
      '',
      null,
    ]) {
      expect(getOriginalSource({ ...webChunk, url })).toBeNull()
    }
    // 知识图谱汇总：有知识库 ID，但没有文档 ID，也没有链接
    expect(getOriginalSource({ ...documentChunk, document_id: '' })).toBeNull()
  })
})

describe('original source actions', () => {
  it('opens knowledge base documents in the preview from the popover and the sheet', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const preview = '/document/doc%201%2F2/preview?name=harness.pdf'

    const popover = await openPopover(documentChunk)
    const source = button(popover, '原文')!
    expect(source.title).toBe('在新标签页中打开完整文档')
    await act(async () => source.click())
    expect(open).toHaveBeenLastCalledWith(preview, '_blank')

    const sheet = await openSheet(documentChunk)
    await act(async () => button(sheet, '查看原文')!.click())
    expect(open).toHaveBeenLastCalledWith(preview, '_blank')
  })

  it('opens web results at their page without opener or referrer', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const page = 'https://arxiv.org/abs/2606.14249'

    const popover = await openPopover(webChunk)
    const source = button(popover, '原文')!
    expect(source.title).toBe('在新标签页中打开来源网页')
    await act(async () => source.click())
    expect(open).toHaveBeenLastCalledWith(page, '_blank', 'noopener,noreferrer')

    const sheet = await openSheet(webChunk)
    const view = button(sheet, '查看原文')!
    expect(view.title).toBe('在新标签页中打开来源网页')
    await act(async () => view.click())
    expect(open).toHaveBeenLastCalledWith(page, '_blank', 'noopener,noreferrer')
    expect(open).not.toHaveBeenCalledWith(
      expect.stringContaining('/document/'),
      expect.anything(),
    )
  })

  it('shows no source action when there is nowhere safe to go', async () => {
    const unsafe = { ...webChunk, url: 'javascript:alert(1)' }

    const popover = await openPopover(unsafe)
    expect(
      [...popover.querySelectorAll('button')].map((element) =>
        element.textContent?.trim(),
      ),
    ).toEqual(['复制', '详情'])

    const sheet = await openSheet(unsafe)
    expect(button(sheet, '查看原文')).toBeUndefined()
  })
})
