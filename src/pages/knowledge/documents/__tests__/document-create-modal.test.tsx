import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentCreationMode } from '@/api/knowledge-rest'
import { DocumentCreateModal } from '../document-create-modal'

const mocks = vi.hoisted(() => ({
  createWeb: vi.fn(),
  createEmpty: vi.fn(),
  parse: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/api/knowledge', () => ({
  knowledgeAPI: {
    document: {
      createWeb: mocks.createWeb,
      createEmpty: mocks.createEmpty,
      parse: mocks.parse,
    },
  },
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

function setInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function submit() {
  document.body
    .querySelector('form')
    ?.dispatchEvent(
      new SubmitEvent('submit', { bubbles: true, cancelable: true }),
    )
}

describe('knowledge document creation', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
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
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('rejects unsafe webpage URLs and keeps entered values after a business failure', async () => {
    const onCreated = vi.fn()
    mocks.createWeb.mockRejectedValue(new Error('private backend detail'))
    await act(async () => {
      root.render(
        <DocumentCreateModal
          mode={DocumentCreationMode.WEB}
          kbId="kb-1"
          onClose={vi.fn()}
          onCreated={onCreated}
        />,
      )
    })

    const inputs = [
      ...document.body.querySelectorAll<HTMLInputElement>('input'),
    ]
    const name = inputs.find((input) => input.type === 'text')!
    const url = inputs.find((input) => input.type === 'url')!
    await act(async () => {
      setInput(name, ' Article ')
      setInput(url, 'javascript:alert(1)')
      submit()
    })
    expect(mocks.createWeb).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('documentCreate.urlInvalid')

    await act(async () => {
      setInput(url, 'https://example.com/article')
      submit()
      await Promise.resolve()
    })
    expect(mocks.createWeb).toHaveBeenCalledWith(
      'kb-1',
      'Article',
      'https://example.com/article',
    )
    expect(mocks.error).toHaveBeenCalledWith('documentCreate.createFailed')
    expect(mocks.error).not.toHaveBeenCalledWith('private backend detail')
    expect(name.value).toBe(' Article ')
    expect(url.value).toBe('https://example.com/article')
    expect(onCreated).not.toHaveBeenCalled()

    const created = { id: 'doc-web', name: 'Article.pdf', dataset_id: 'kb-1' }
    mocks.createWeb.mockResolvedValue(created)
    mocks.parse.mockResolvedValue(undefined)
    await act(async () => {
      submit()
      await Promise.resolve()
    })
    expect(mocks.parse).toHaveBeenCalledWith('kb-1', ['doc-web'])
    expect(onCreated).toHaveBeenCalledWith(created, DocumentCreationMode.WEB)
  })

  it('preserves a created web document when canonical parse is not confirmed', async () => {
    const onCreated = vi.fn()
    const created = { id: 'doc-web', name: 'Article.pdf', dataset_id: 'kb-1' }
    mocks.createWeb.mockResolvedValue(created)
    mocks.parse.mockRejectedValue(new Error('private parse detail'))
    await act(async () => {
      root.render(
        <DocumentCreateModal
          mode={DocumentCreationMode.WEB}
          kbId="kb-1"
          onClose={vi.fn()}
          onCreated={onCreated}
        />,
      )
    })
    const inputs = [
      ...document.body.querySelectorAll<HTMLInputElement>('input'),
    ]
    await act(async () => {
      setInput(inputs.find((input) => input.type === 'text')!, 'Article')
      setInput(
        inputs.find((input) => input.type === 'url')!,
        'https://example.com/article',
      )
      submit()
    })
    expect(mocks.parse).toHaveBeenCalledWith('kb-1', ['doc-web'])
    expect(mocks.success).toHaveBeenCalledWith('documentCreate.webSuccess')
    expect(mocks.success).not.toHaveBeenCalledWith(
      'documentCreate.parseStarted',
    )
    expect(mocks.error).toHaveBeenCalledWith('documentCreate.parseFailed')
    expect(mocks.error).not.toHaveBeenCalledWith('private parse detail')
    expect(mocks.error).not.toHaveBeenCalledWith('documentCreate.createFailed')
    expect(onCreated).toHaveBeenCalledWith(created, DocumentCreationMode.WEB)
  })

  it('creates a blank document and returns its id for the chunk editor', async () => {
    const onCreated = vi.fn()
    const created = { id: 'doc-empty', name: 'Draft.txt', dataset_id: 'kb-1' }
    mocks.createEmpty.mockResolvedValue(created)
    await act(async () => {
      root.render(
        <DocumentCreateModal
          mode={DocumentCreationMode.EMPTY}
          kbId="kb-1"
          onClose={vi.fn()}
          onCreated={onCreated}
        />,
      )
    })

    const name = document.body.querySelector<HTMLInputElement>('input')!
    await act(async () => {
      setInput(name, '  Draft.txt  ')
      submit()
      await Promise.resolve()
    })
    expect(mocks.createEmpty).toHaveBeenCalledWith('kb-1', 'Draft.txt')
    expect(mocks.parse).not.toHaveBeenCalled()
    expect(onCreated).toHaveBeenCalledWith(created, DocumentCreationMode.EMPTY)
    expect(mocks.success).toHaveBeenCalledWith('documentCreate.blankSuccess')
  })
})
