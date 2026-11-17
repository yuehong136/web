import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { stubChatDOM } from './chat-dom'
import { MermaidDiagram } from '../mermaid-diagram'

const mermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}))
vi.mock('mermaid', () => ({ default: mermaid }))
vi.mock('react-shiki/core', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))

let root: Root
let host: HTMLDivElement
const config = { securityLevel: 'strict', theme: 'base' }

const render = async (code = 'graph TD\nA-->B', streaming = false) => {
  await act(async () =>
    root.render(
      <MermaidDiagram code={code} config={config} streaming={streaming} />,
    ),
  )
  // The diagram renders asynchronously (dynamic import, then Mermaid).
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(async () => {
  stubChatDOM()
  await setProductLanguage('en-US')
  mermaid.initialize.mockReset()
  mermaid.render.mockReset()
  mermaid.render.mockResolvedValue({
    svg: '<svg data-test-svg viewBox="0 0 10 10"><script>alert(1)</script><g><text>A</text></g></svg>',
  })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('renders the diagram with its own config and sanitizes the SVG', async () => {
  await render()
  expect(mermaid.initialize).toHaveBeenCalledWith(
    expect.objectContaining({ startOnLoad: false, securityLevel: 'strict' }),
  )
  const picture = host.querySelector('[role="img"]')!
  expect(picture.querySelector('svg[data-test-svg]')).not.toBeNull()
  expect(picture.querySelector('script')).toBeNull()
})

it('shows the source in the shared code block and zooms the picture', async () => {
  await render()
  const zoomIn = host.querySelector<HTMLButtonElement>(
    'button[aria-label="Zoom in"]',
  )!
  await act(async () => zoomIn.click())
  expect(
    host.querySelector<HTMLElement>('[role="img"]')!.style.transform,
  ).toContain('scale(1.2)')
  const source = [...host.querySelectorAll('[role="radio"]')].find(
    (item) => item.textContent === 'Source',
  ) as HTMLElement
  await act(async () => source.click())
  expect(host.querySelector('[role="img"]')).toBeNull()
  expect(host.querySelector('.code-block')?.textContent).toContain('A-->B')
})

it('falls back to the source when a finished diagram cannot render', async () => {
  mermaid.render.mockRejectedValue(new Error('Parse error'))
  await render('graph TD\nA-->')
  expect(host.querySelector('[data-mermaid-diagram]')).toBeNull()
  expect(host.querySelector('.code-block')?.textContent).toContain('A-->')
})
