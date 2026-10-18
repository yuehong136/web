import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { createInstance } from 'i18next'
import { ThinkWrapper } from '../ThinkWrapper'
import { RetrievalProgress } from '../retrieval-progress'
import { extractThinkContent } from '@/utils/think-utils'
import en from '@/locales/en-US/chat'
import zh from '@/locales/zh-CN/chat'

const i18n = createInstance()
await i18n.init({
  lng: 'en-US',
  resources: { 'en-US': { translation: en }, 'zh-CN': { translation: zh } },
})
const container = document.createElement('div')
document.body.append(container)
const root = createRoot(container)
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
afterEach(async () => {
  await act(async () => root.render(null))
  await i18n.changeLanguage('en-US')
})

it('independently collapses retrieval and reasoning, keeping user choice while streaming updates', async () => {
  const render = async (streaming: boolean) =>
    act(async () =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <RetrievalProgress
            result={extractThinkContent('<retrieving>lookup')}
            isStreaming={streaming}
          />
          <ThinkWrapper
            messageId="same"
            status={streaming ? 'thinking' : 'complete'}
          >
            reasoning
          </ThinkWrapper>
        </I18nextProvider>,
      ),
    )
  await render(true)
  let buttons = container.querySelectorAll('button')
  expect(
    [...buttons].map((button) => button.getAttribute('aria-expanded')),
  ).toEqual(['false', 'false'])
  expect(buttons[0].textContent).toBe('Retrieving...')
  expect(buttons[1].textContent).toBe('Thinking...')
  await act(async () => buttons[0].click())
  expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
  expect(buttons[1].getAttribute('aria-expanded')).toBe('false')
  await render(true)
  await render(false)
  buttons = container.querySelectorAll('button')
  expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
  expect(buttons[0].textContent).toBe('Retrieval interrupted')
  expect(buttons[1].textContent).toBe('Thought process')
})

it('localizes completed retrieval, resets folding for a new message and renders untrusted text safely', async () => {
  await i18n.changeLanguage('zh-CN')
  const body = '<script>bad()</script><img src=x onerror=bad()>&lt;think&gt;'
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <RetrievalProgress
          result={extractThinkContent(`<retrieving>${body}</retrieving>`)}
          isStreaming={false}
        />
        <ThinkWrapper messageId="one" status="complete">
          {body}
        </ThinkWrapper>
      </I18nextProvider>,
    ),
  )
  const buttons = container.querySelectorAll('button')
  expect(buttons[0].textContent).toBe('检索过程')
  expect(buttons[1].textContent).toBe('思考过程')
  await act(async () => buttons.forEach((button) => button.click()))
  expect(container.querySelector('script, img')).toBeNull()
  expect(container.textContent).toContain(body)
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <ThinkWrapper messageId="two" status="complete">
          new
        </ThinkWrapper>
      </I18nextProvider>,
    ),
  )
  expect(container.querySelector('button')?.getAttribute('aria-expanded')).toBe(
    'false',
  )
})
