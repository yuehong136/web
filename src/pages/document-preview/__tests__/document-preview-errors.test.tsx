import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { setProductLanguage } from '@/locales/i18n'
import DocumentPreviewPage from '..'

vi.mock('@/lib/toast', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))
vi.mock('antd', () => ({
  Watermark: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
// 各格式渲染器依赖的 pdf.js / Office 解析库不在 jsdom 加载；失败态由共享组件渲染
vi.mock(
  '@/components/knowledge/document-preview/components/pdf-preview',
  () => ({
    PdfPreview: () => null,
  }),
)
vi.mock(
  '@/components/knowledge/document-preview/components/docx-preview',
  () => ({
    DocxPreview: () => null,
  }),
)
vi.mock(
  '@/components/knowledge/document-preview/components/excel-preview',
  () => ({
    ExcelPreview: () => null,
  }),
)
vi.mock(
  '@/components/knowledge/document-preview/components/ppt-preview',
  () => ({
    PptPreview: () => null,
  }),
)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

/** 本地 MultiRAG 的实际失败响应；后端原文绝不能出现在界面上 */
const failures = {
  notFound: () => json({ code: 101, message: 'Document not found!' }),
  forbidden: () => json({ retcode: 109, retmsg: 'No authorization.' }),
  sessionExpired: () =>
    json({ code: 401, message: 'Invalid credentials' }, 401),
  empty: () =>
    new Response('', { headers: { 'content-type': 'application/pdf' } }),
  network: () => Promise.reject(new TypeError('Failed to fetch')),
}
const BACKEND_TEXT = [
  'Document not found!',
  'No authorization.',
  'Invalid credentials',
  'No download permission',
  'Failed to fetch',
]

let root: Root
let container: HTMLDivElement
let preview: () => Response | Promise<Response>
let download: () => Response | Promise<Response>

const pageText = () => document.body.textContent ?? ''

const settle = async (done: () => boolean) => {
  for (let attempt = 0; attempt < 50 && !done(); attempt += 1) {
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)))
  }
}

async function renderPage() {
  await act(async () =>
    root.render(
      <MemoryRouter
        initialEntries={['/document/doc-1/preview?name=report.pdf']}
      >
        <Routes>
          <Route
            path="/document/:docId/preview"
            element={<DocumentPreviewPage />}
          />
        </Routes>
      </MemoryRouter>,
    ),
  )
}

beforeEach(async () => {
  await setProductLanguage('zh-CN')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.mocked(toast.error).mockClear()
  preview = () => new Promise<Response>(() => undefined)
  download = () => new Promise<Response>(() => undefined)
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) =>
      /\/download(\?|$)/.test(String(input)) ? download() : preview(),
    ),
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  await setProductLanguage('zh-CN')
})

describe('document preview failures', () => {
  it.each<[keyof typeof failures, string, string]>([
    [
      'notFound',
      '文档不存在或已被删除。',
      'This document does not exist or has been deleted.',
    ],
    [
      'forbidden',
      '没有查看此文档的权限。',
      'You do not have permission to view this document.',
    ],
    [
      'sessionExpired',
      '登录已过期，请重新登录后再查看。',
      'Your session has expired. Sign in again to view this document.',
    ],
    [
      'empty',
      '文件为空或格式不受支持，无法预览。',
      'This file is empty or in a format that cannot be previewed.',
    ],
    [
      'network',
      '暂时无法加载预览。请检查网络连接，或稍后重试。',
      'The preview could not be loaded. Check your connection or try again later.',
    ],
  ])('shows fixed copy for %s', async (failure, zh, en) => {
    preview = failures[failure]
    await renderPage()
    await settle(() => pageText().includes(zh))

    expect(pageText()).toContain('加载失败')
    expect(pageText()).toContain(zh)

    await act(async () => setProductLanguage('en-US'))
    expect(pageText()).toContain('Load failed')
    expect(pageText()).toContain(en)
    for (const text of BACKEND_TEXT) expect(pageText()).not.toContain(text)
  })
})

// 下载走 REST 文件端点：失败用 HTTP 状态表达，200 的响应体一律是文件本身
describe('document download failures', () => {
  const clickDownload = async () => {
    const button = container.querySelector<HTMLButtonElement>(
      'button[aria-label="下载文件"]',
    )
    expect(button).not.toBeNull()
    await act(async () => button?.click())
  }

  it.each<[string, () => Response | Promise<Response>, string]>([
    [
      'a refused download',
      () =>
        json(
          {
            code: 403,
            message:
              'No download permission. Please contact your administrator.',
          },
          403,
        ),
      '没有下载此文档的权限，请联系管理员。',
    ],
    [
      'a missing document',
      () => json({ code: 404, message: 'Document not found!' }, 404),
      '文档不存在或已被删除，无法下载。',
    ],
    [
      'an expired session',
      failures.sessionExpired,
      '登录已过期，请重新登录后再下载。',
    ],
    [
      'a network failure',
      failures.network,
      '下载失败。请检查网络连接，或稍后重试。',
    ],
  ])('toasts fixed copy for %s', async (_, response, message) => {
    download = response
    await renderPage()
    await clickDownload()
    await settle(() => vi.mocked(toast.error).mock.calls.length > 0)

    expect(toast.error).toHaveBeenCalledExactlyOnceWith(message)
    const shown = JSON.stringify(vi.mocked(toast.error).mock.calls)
    for (const text of BACKEND_TEXT) expect(shown).not.toContain(text)
  })

  it('saves an HTML original instead of treating it as a login page', async () => {
    const saved: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push(this.download)
    })
    const { createObjectURL, revokeObjectURL } = URL
    URL.createObjectURL = vi.fn(() => 'blob:report')
    URL.revokeObjectURL = vi.fn()
    download = () =>
      new Response('<h1>HarnessX</h1>', {
        headers: { 'content-type': 'text/html' },
      })

    try {
      await renderPage()
      await clickDownload()
      await settle(() => saved.length > 0)
    } finally {
      URL.createObjectURL = createObjectURL
      URL.revokeObjectURL = revokeObjectURL
    }

    expect(saved).toEqual(['report.pdf'])
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('document preview chrome', () => {
  it('labels the icon buttons in the current language', async () => {
    await renderPage()
    expect(container.querySelector('button[aria-label="返回"]')).not.toBeNull()

    await act(async () => setProductLanguage('en-US'))
    expect(container.querySelector('button[aria-label="Back"]')).not.toBeNull()
    expect(
      container.querySelector('button[aria-label="Download file"]'),
    ).not.toBeNull()
  })
})
