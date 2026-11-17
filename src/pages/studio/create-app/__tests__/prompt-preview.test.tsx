import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderMarkdown } from '../components/prompt-preview'

// As in the chat tests: keep antd-x's diagram/highlighter bundle out of jsdom.
vi.mock('@ant-design/x', () => ({ Mermaid: () => null }))

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('renders the system prompt as Markdown and shows prompt markup as text', async () => {
  await act(async () =>
    root.render(
      <>
        {renderMarkdown(
          '# Role\n\nAnswer from **context** only.\n\n<context>{knowledge}</context>\n\n<img src=x onerror="alert(1)">',
        )}
      </>,
    ),
  )
  expect(container.querySelector('h1')?.textContent).toBe('Role')
  expect(container.querySelector('strong')?.textContent).toBe('context')
  // Prompt markup is text the model receives, not HTML to execute.
  expect(container.textContent).toContain('<context>{knowledge}</context>')
  expect(container.querySelector('context, img, [onerror]')).toBeNull()
})

it('passes non-string content through untouched', () => {
  expect(renderMarkdown('')).toBe('')
  expect(renderMarkdown(null)).toBeNull()
})
