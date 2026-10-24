import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MarkdownArtifactImage } from '../MarkdownArtifact'
import en from '@/locales/en-US/chat'
import zh from '@/locales/zh-CN/chat'
import { stubChatDOM } from './chat-dom'
import type { ComponentProps } from '@ant-design/x-markdown'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
let root: Root
let host: HTMLDivElement
beforeEach(() => {
  stubChatDOM()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it.each([
  ['en-US', en, 'Loading artifact image...', 'Failed to load artifact image'],
  ['zh-CN', zh, '正在加载产物图片...', '产物图片加载失败'],
] as const)(
  'artifact feedback works with only the shared chat catalog in %s',
  async (language, catalog, loading, failed) => {
    const isolated = createInstance()
    await isolated.init({
      lng: language,
      resources: { [language]: { translation: catalog } },
    })
    let reject!: (error: unknown) => void
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise((_resolve, rejectPromise) => {
            reject = rejectPromise
          }),
      ),
    )
    await act(async () =>
      root.render(
        <I18nextProvider i18n={isolated}>
          <MarkdownArtifactImage
            src="/api/v1/documents/artifact/fixture.png"
            alt="Fixture"
            domNode={{} as ComponentProps['domNode']}
            streamStatus="done"
          />
        </I18nextProvider>,
      ),
    )
    expect(host.textContent).toContain(loading)
    expect(
      isolated.getResource(language, 'translation', 'agent'),
    ).toBeUndefined()
    await act(async () => {
      reject(new Error('private backend detail'))
      await Promise.resolve()
    })
    expect(host.textContent).toContain(failed)
    expect(host.textContent).not.toContain('private backend detail')
    expect(host.textContent).not.toContain('agent.markdownArtifact')
  },
)
