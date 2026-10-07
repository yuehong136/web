import { act, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { DocxPreview } from '../components/docx-preview'
import { ExcelPreview } from '../components/excel-preview'
import { PptPreview } from '../components/ppt-preview'

const parsers = vi.hoisted(() => ({
  docx: vi.fn(),
  excel: vi.fn(),
  ppt: vi.fn(),
}))

vi.mock('mammoth', () => ({ default: { convertToHtml: parsers.docx } }))
vi.mock('@js-preview/excel', () => ({
  default: {
    init: () => ({ preview: parsers.excel, destroy: () => undefined }),
  },
}))
vi.mock('@js-preview/excel/lib/index.css', () => ({}))
vi.mock('pptx-preview', () => ({ init: () => ({ preview: parsers.ppt }) }))

type Preview = ComponentType<{ arrayBuffer?: ArrayBuffer; sourceUrl: string }>

/** 解析库（JSZip 等）自己的报错，只能留在控制台 */
const PARSER_MESSAGE =
  "Can't find end of central directory : is this a zip file ?"
const UNREADABLE = {
  zh: '无法解析此文件，文件可能已损坏或格式不受支持。',
  en: 'This file could not be read. It may be damaged or in an unsupported format.',
}

let root: Root
let container: HTMLDivElement

const text = () => container.textContent ?? ''

const settle = async (done: () => boolean) => {
  for (let attempt = 0; attempt < 50 && !done(); attempt += 1) {
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)))
  }
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
  vi.restoreAllMocks()
  for (const parser of Object.values(parsers)) parser.mockReset()
  await setProductLanguage('zh-CN')
})

describe.each<[string, Preview, keyof typeof parsers, string, string, string]>([
  [
    'Word',
    DocxPreview,
    'docx',
    '文档预览失败',
    'Document preview failed',
    '加载文档中...',
  ],
  [
    'Excel',
    ExcelPreview,
    'excel',
    'Excel 预览失败',
    'Excel preview failed',
    '加载 Excel 中...',
  ],
  [
    'PowerPoint',
    PptPreview,
    'ppt',
    'PPT 预览失败',
    'PPT preview failed',
    '加载 PPT 中...',
  ],
])('%s preview', (_, Preview, parser, zhTitle, enTitle, loadingText) => {
  const renderPreview = () =>
    act(async () =>
      root.render(
        <Preview
          arrayBuffer={new ArrayBuffer(8)}
          sourceUrl="http://localhost:8123/v1/document/get/doc-1"
        />,
      ),
    )

  it('shows fixed copy instead of the parser error', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    parsers[parser].mockRejectedValue(new Error(PARSER_MESSAGE))

    await renderPreview()
    await settle(() => text().includes(zhTitle))

    expect(text()).toContain(zhTitle)
    expect(text()).toContain(UNREADABLE.zh)
    expect(text()).not.toContain(PARSER_MESSAGE)
    // 原始报错仍在控制台，便于排查损坏文件
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('preview error'),
      expect.objectContaining({ message: PARSER_MESSAGE }),
    )

    await act(async () => setProductLanguage('en-US'))
    await settle(() => text().includes(enTitle))

    expect(text()).toContain(UNREADABLE.en)
    expect(text()).not.toContain(PARSER_MESSAGE)
  })

  it('still renders the document when parsing succeeds', async () => {
    parsers[parser].mockResolvedValue({ value: '<p>Quarterly report</p>' })

    await renderPreview()
    await settle(() => !text().includes(loadingText))

    expect(parsers[parser]).toHaveBeenCalledOnce()
    expect(text()).not.toContain(loadingText)
    expect(text()).not.toContain(zhTitle)
    expect(text()).not.toContain(UNREADABLE.zh)
    if (parser === 'docx') expect(text()).toContain('Quarterly report')
  })
})
