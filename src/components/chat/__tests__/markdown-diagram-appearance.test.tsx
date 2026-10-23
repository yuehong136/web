import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { markdownCodeComponents } from '../MarkdownCodeBlock'
import { ScopedTheme } from '@/themes'
import { stubChatDOM } from './chat-dom'
import type { ComponentProps } from '@ant-design/x-markdown'

vi.mock('react-shiki', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))
vi.mock('@ant-design/x', () => ({
  Mermaid: ({ config }: { config: unknown }) => (
    <output data-diagram-config>{JSON.stringify(config)}</output>
  ),
}))
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

it('the real Markdown diagram adapter passes scoped mode, palette and text size to Mermaid', async () => {
  const Code = markdownCodeComponents.code
  const props = {
    block: true,
    lang: 'mermaid',
    streamStatus: 'loading',
    domNode: {},
    children: 'graph TD\nA-->B',
  } as ComponentProps
  const config = () =>
    JSON.parse(host.querySelector('[data-diagram-config]')!.textContent!)
  await act(async () =>
    root.render(
      <ScopedTheme theme="light" preset="paper" textScale={1}>
        <Code {...props} />
      </ScopedTheme>,
    ),
  )
  const light = config()
  expect(light.securityLevel).toBe('strict')
  expect(light.themeVariables.darkMode).toBe(false)
  expect(light.themeVariables.fontSize).toBe('14px')
  await act(async () =>
    root.render(
      <ScopedTheme theme="dark" preset="ocean" textScale={1.25}>
        <Code {...props} />
      </ScopedTheme>,
    ),
  )
  const dark = config()
  expect(dark.themeVariables.darkMode).toBe(true)
  expect(dark.themeVariables.fontSize).toBe('17.5px')
  expect(dark.themeVariables.primaryColor).not.toBe(
    light.themeVariables.primaryColor,
  )
  expect(dark.themeVariables.primaryTextColor).not.toBe(
    light.themeVariables.primaryTextColor,
  )
})
