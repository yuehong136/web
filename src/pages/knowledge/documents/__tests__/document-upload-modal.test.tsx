import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentUploadModal } from '../document-upload-modal'
import i18n, { setProductLanguage } from '@/locales/i18n'
import { APIError } from '@/api/client'

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  parse: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))
vi.mock('@/api/knowledge', () => ({
  knowledgeAPI: { document: { upload: mocks.upload, parse: mocks.parse } },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error, info: mocks.info },
}))

function button(key: string, count = 1) {
  const text = i18n.t(key, { count })
  return [...document.body.querySelectorAll('button')].find(
    (element) => element.textContent?.trim() === text,
  )!
}

describe('dataset upload and parsing', () => {
  let root: Root
  beforeEach(async () => {
    await setProductLanguage('en-US')
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    Object.values(mocks).forEach((mock) => mock.mockReset())
    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('retains native file bytes, name and size through pending/uploaded states when parse fails', async () => {
    let resolveUpload!: (docs: { id: string; name: string }[]) => void
    mocks.upload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve
        }),
    )
    mocks.parse.mockRejectedValue(new Error('private parse detail'))
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    await act(async () =>
      root.render(
        <DocumentUploadModal
          open
          kbId="kb"
          onClose={onClose}
          onSuccess={onSuccess}
        />,
      ),
    )
    const file = new File(['original bytes'], 'original.txt', {
      type: 'text/plain',
      lastModified: 123,
    })
    const input =
      document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(document.body.textContent).toContain('original.txt')
    expect(document.body.textContent).toContain('14 Bytes')
    await act(async () =>
      button('knowledge.documents.upload.uploadCount').click(),
    )
    expect(mocks.upload).toHaveBeenCalledWith('kb', [file])
    expect(mocks.upload.mock.calls[0][1][0]).toBe(file)
    expect(file).toBeInstanceOf(File)
    expect(file.lastModified).toBe(123)
    expect(document.body.textContent).toContain('original.txt')
    expect(document.body.textContent).toContain('14 Bytes')
    expect(document.body.textContent).not.toContain('NaN')
    await act(async () => {
      resolveUpload([{ id: 'created-doc', name: 'original.txt' }])
    })
    expect(mocks.parse).toHaveBeenCalledWith('kb', ['created-doc'])
    expect(mocks.success).toHaveBeenCalledWith(
      i18n.t('knowledge.documents.upload.success', { count: 1 }),
    )
    expect(mocks.success).not.toHaveBeenCalledWith(
      i18n.t('knowledge.documents.toasts.parseStarted', { count: 1 }),
    )
    expect(mocks.error).toHaveBeenCalledWith(
      i18n.t('knowledge.documents.upload.autoParseError'),
    )
    expect(mocks.error).not.toHaveBeenCalledWith('private parse detail')
    expect(document.body.textContent).toContain('original.txt')
    expect(document.body.textContent).toContain('14 Bytes')
    expect(document.body.textContent).not.toContain('NaN')
    expect(onClose).not.toHaveBeenCalled()
    await act(async () => button('common.close').click())
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps failed and unconfirmed files, retries only remaining files, and never exposes remote errors', async () => {
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    const first = new File(['one'], 'first.txt', { type: 'text/plain' })
    const second = new File(['name\tvalue\ntwo\t0'], 'second.tsv', {
      type: 'text/tab-separated-values',
    })
    mocks.upload.mockResolvedValueOnce([
      { id: 'first-created', name: 'first.txt' },
    ])
    mocks.parse.mockResolvedValue(undefined)
    await act(async () =>
      root.render(
        <DocumentUploadModal
          open
          kbId="kb"
          onClose={onClose}
          onSuccess={onSuccess}
        />,
      ),
    )
    const input =
      document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [first, second],
    })
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    await act(async () =>
      button('knowledge.documents.upload.uploadCount', 2).click(),
    )
    expect(mocks.parse).toHaveBeenCalledWith('kb', ['first-created'])
    expect(onClose).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('second.tsv')
    expect(document.body.textContent).toContain(
      i18n.t('knowledge.documents.upload.notConfirmed'),
    )
    expect(onSuccess).toHaveBeenCalledOnce()
    mocks.upload.mockRejectedValueOnce(
      new APIError(200, '102', 'secret-token=do-not-show'),
    )
    await act(async () =>
      button('knowledge.documents.upload.uploadRemaining').click(),
    )
    expect(mocks.upload.mock.calls[1][1]).toEqual([second])
    expect(document.body.textContent).not.toContain('secret-token')
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain('secret-token')
    expect(document.body.textContent).toContain(
      i18n.t('knowledge.documents.upload.retryHint'),
    )
    await act(async () => {
      await setProductLanguage('zh-CN')
    })
    expect(document.body.textContent).toContain(
      i18n.t('knowledge.documents.upload.retryHint'),
    )
    expect(document.body.textContent).toContain('second.tsv')
    mocks.upload.mockResolvedValueOnce([
      { id: 'second-created', name: 'second.tsv' },
    ])
    await act(async () =>
      button('knowledge.documents.upload.uploadRemaining').click(),
    )
    expect(mocks.upload.mock.calls[2][1]).toEqual([second])
    expect(mocks.parse).toHaveBeenLastCalledWith('kb', ['second-created'])
    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onClose).not.toHaveBeenCalled()
    await act(async () => button('common.close').click())
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores a late response after its upload session closes', async () => {
    let resolveUpload!: (value: unknown) => void
    mocks.upload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve
        }),
    )
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    const props = { kbId: 'kb', onClose, onSuccess }
    await act(async () => root.render(<DocumentUploadModal open {...props} />))
    const file = new File(['bytes'], 'old.txt', { type: 'text/plain' })
    const input =
      document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    await act(async () =>
      button('knowledge.documents.upload.uploadCount').click(),
    )
    await act(async () =>
      root.render(<DocumentUploadModal open={false} {...props} />),
    )
    await act(async () => {
      resolveUpload([{ id: 'late', name: 'old.txt' }])
    })
    expect(onSuccess).not.toHaveBeenCalled()
    expect(mocks.parse).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toContain('old.txt')
  })
  it('isolates table roles per file, retains failed configs on retry and parses only confirmed documents', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const onSuccess = vi.fn()
    const first = new File(['shared,a.b\n1,2'], 'first.csv', {
      type: 'text/csv',
    })
    const second = new File(['shared,region\n3,4'], 'second.csv', {
      type: 'text/csv',
    })
    await act(async () =>
      root.render(
        <DocumentUploadModal
          open
          kbId="kb"
          isTableParser
          onClose={vi.fn()}
          onSuccess={onSuccess}
        />,
      ),
    )
    const input =
      document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [first, second],
    })
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    await vi.waitFor(() =>
      expect(
        document.body.querySelectorAll('output')[0]?.textContent,
      ).toContain(i18n.t('knowledge.documents.upload.tableHeadersScope')),
    )
    async function choose(label: string, value: string) {
      await act(async () =>
        document.body
          .querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
          .click(),
      )
      await vi.waitFor(() =>
        expect(
          [
            ...document.body.querySelectorAll<HTMLElement>('[role="option"]'),
          ].map((item) => item.textContent?.trim()),
        ).toContain(value),
      )
      await act(async () =>
        [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
          .find((item) => item.textContent?.trim() === value)!
          .click(),
      )
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    await choose(
      'first.csv: ' + i18n.t('knowledge.settings.configuration.table.mode'),
      i18n.t('knowledge.settings.configuration.table.manual'),
    )
    await choose(
      'first.csv: shared',
      i18n.t('knowledge.settings.configuration.table.indexing'),
    )
    await choose(
      'second.csv: ' + i18n.t('knowledge.settings.configuration.table.mode'),
      i18n.t('knowledge.settings.configuration.table.manual'),
    )
    await choose(
      'second.csv: shared',
      i18n.t('knowledge.settings.configuration.table.metadata'),
    )
    mocks.upload
      .mockResolvedValueOnce([{ id: 'first-doc', name: 'first.csv' }])
      .mockRejectedValueOnce(new Error('private upload error'))
    mocks.parse.mockResolvedValue(undefined)
    await act(async () =>
      button('knowledge.documents.upload.uploadCount', 2).click(),
    )
    expect(mocks.upload).toHaveBeenNthCalledWith(1, 'kb', [first], {
      parser_config: {
        table_column_mode: 'manual',
        table_column_roles: { shared: 'indexing', 'a.b': 'both' },
      },
    })
    expect(mocks.upload).toHaveBeenNthCalledWith(2, 'kb', [second], {
      parser_config: {
        table_column_mode: 'manual',
        table_column_roles: { shared: 'metadata', region: 'both' },
      },
    })
    expect(mocks.parse).toHaveBeenCalledWith('kb', ['first-doc'])
    expect(document.body.textContent).not.toContain('private upload error')
    mocks.upload.mockResolvedValueOnce([
      { id: 'second-doc', name: 'second.csv' },
    ])
    await act(async () =>
      button('knowledge.documents.upload.uploadRemaining').click(),
    )
    expect(mocks.upload.mock.calls[2]).toEqual(mocks.upload.mock.calls[1])
    expect(mocks.parse).toHaveBeenLastCalledWith('kb', ['second-doc'])
  })
})
