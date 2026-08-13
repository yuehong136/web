import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { setProductLanguage } from '@/locales/i18n'

describe('Desktop workspace localization', () => {
  beforeAll(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  afterEach(async () => {
    await setProductLanguage('zh-CN')
  })

  it('localizes the shared empty-model action in English', async () => {
    await setProductLanguage('en-US')

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <ChatModelSelector
          models={{}}
          selectedModelName={null}
          onSelect={() => undefined}
          variant="minimal"
        />
      </MemoryRouter>,
    )

    expect(markup).toContain('Configure model')
    expect(markup).toContain('Open model settings')
    expect(markup).not.toContain('配置模型')
  })
})
