import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { DocumentChunksWorkspace } from '../components/document-chunks-shell'
import type { ChunkListDocument } from '../types'

// pdf.js 渲染器不在 jsdom 加载；这里只看取原文失败后的说明
vi.mock(
  '@/components/knowledge/document-preview/components/pdf-preview',
  () => ({
    PdfPreview: () => null,
  }),
)

let root: Root
let container: HTMLDivElement

const settle = async (done: () => boolean) => {
  for (let attempt = 0; attempt < 50 && !done(); attempt += 1) {
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)))
  }
}

beforeEach(async () => {
  await setProductLanguage('zh-CN')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  // 不回调宽度：工作区按窄屏处理，原文在侧边面板里打开
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
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

it.each<[string, () => Promise<Response>, string]>([
  [
    'a deleted document',
    async () =>
      new Response(
        JSON.stringify({ code: 101, message: 'Document not found!' }),
        { headers: { 'content-type': 'application/json' } },
      ),
    '文档不存在或已被删除。',
  ],
  [
    'a network failure',
    () => Promise.reject(new TypeError('Failed to fetch')),
    '暂时无法读取原文。可以重试，或关闭预览继续审阅切片。',
  ],
])('explains %s in the source pane', async (_, respond, description) => {
  vi.stubGlobal('fetch', vi.fn(respond))

  await act(async () =>
    root.render(
      <DocumentChunksWorkspace
        previewOpen
        onClosePreview={() => undefined}
        docId="doc-1"
        docInfo={{ name: 'report.pdf', type: 'pdf' } as ChunkListDocument}
        selectedChunk={null}
      >
        <p>chunks</p>
      </DocumentChunksWorkspace>,
    ),
  )
  const text = () => document.body.textContent ?? ''
  await settle(() => text().includes(description))

  expect(text()).toContain('加载失败')
  expect(text()).toContain(description)
  expect(text()).not.toContain('Document not found!')
  expect(text()).not.toContain('Failed to fetch')
  const retry = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === '重试',
  )
  expect(retry).toBeDefined()
})
