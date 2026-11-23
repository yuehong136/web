import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n, { setProductLanguage } from '@/locales/i18n'
import { CodeBlock, codeFileExtension } from '../CodeBlock'

vi.mock('@/components/chat/code-highlight', () => ({
  CodeHighlight: ({ code }: { code: string }) => (
    <pre className="shiki">
      <code>{code}</code>
    </pre>
  ),
}))
const download = vi.hoisted(() => vi.fn())
vi.mock('@/lib/download', () => ({ downloadTextFile: download }))

let root: Root
let host: HTMLDivElement
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  download.mockReset()
  vi.unstubAllGlobals()
})

const block = () => host.querySelector<HTMLElement>('.code-block')!
const button = (name: string) =>
  host.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)
const lines = (count: number) =>
  Array.from({ length: count }, (_, i) => `line ${i + 1}`).join('\n')

it('shows the language and a live line count while streaming, and no tools', async () => {
  await act(async () =>
    root.render(<CodeBlock code={lines(3)} language="ts" streaming />),
  )
  expect(host.querySelector('[data-code-lines]')?.textContent).toBe('3 lines')
  expect(button(i18n.t('chat.code.wrap'))).toBeNull()
  expect(button('Copy')).toBeNull()
})

it('offers wrap, download, full view and copy once complete', async () => {
  await act(async () =>
    root.render(<CodeBlock code={lines(3)} language="Python" />),
  )
  const wrap = button(i18n.t('chat.code.wrap'))!
  expect(wrap.getAttribute('aria-pressed')).toBe('false')
  await act(async () => wrap.click())
  expect(block().dataset.wrap).toBe('true')
  expect(wrap.getAttribute('aria-pressed')).toBe('true')

  await act(async () => button(i18n.t('chat.code.download'))!.click())
  expect(download).toHaveBeenCalledWith(lines(3), 'snippet.py')
  expect(button(i18n.t('chat.code.expand'))).not.toBeNull()
  expect(button('Copy')).not.toBeNull()
  // The header stays in view while a long block scrolls past.
  expect(host.querySelector('.code-block-header')?.className).toContain(
    'sticky',
  )
  expect(block().className).toContain('overflow-clip')
})

it('folds long code until asked for the rest', async () => {
  await act(async () =>
    root.render(<CodeBlock code={lines(45)} language="text" />),
  )
  expect(block().dataset.folded).toBe('true')
  const fold = host.querySelector<HTMLButtonElement>('.code-block-fold')!
  expect(fold.textContent).toBe('Show 15 more lines')
  expect(fold.getAttribute('aria-expanded')).toBe('false')
  await act(async () => fold.click())
  expect(block().dataset.folded).toBeUndefined()
  expect(fold.getAttribute('aria-expanded')).toBe('true')

  await act(async () => root.render(<CodeBlock code={lines(30)} />))
  expect(host.querySelector('.code-block-fold')).toBeNull()
})

it('names downloads by language', () => {
  expect(codeFileExtension('typescript')).toBe('ts')
  expect(codeFileExtension('bash')).toBe('sh')
  expect(codeFileExtension('unknown-lang')).toBe('txt')
})
