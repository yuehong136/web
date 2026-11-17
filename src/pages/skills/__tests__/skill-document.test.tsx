import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n from '@/locales/i18n'
import { SkillDocument } from '../skill-document'

let root: Root
let container: HTMLDivElement

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

const show = async (path: string, text: string) => {
  const blob = new Blob([text], { type: 'text/plain' })
  await act(async () => root.render(<SkillDocument path={path} blob={blob} />))
  for (let i = 0; i < 20 && !container.querySelector('article, pre'); i += 1)
    await act(() => new Promise((resolve) => setTimeout(resolve, 5)))
}

it('renders skill Markdown with x-markdown and keeps it untrusted', async () => {
  await show(
    'docs/SKILL.md',
    [
      '---',
      'name: secret-frontmatter',
      '---',
      '# Weather skill',
      '',
      '| a | b |',
      '| - | - |',
      '| 1 | 2 |',
      '',
      '![tracker](https://example.com/pixel.png)',
      '',
      '[docs](https://example.com/docs) [local](./helper.md) [bad](javascript:alert(1))',
      '',
      '<div onclick="alert(1)">raw block</div>',
      '',
      'inline <b>bold</b> html',
    ].join('\n'),
  )

  const article = container.querySelector('article')!
  expect(article.querySelector('h1')?.textContent).toBe('Weather skill')
  expect(article.querySelectorAll('table')).toHaveLength(1)
  expect(article.textContent).not.toContain('secret-frontmatter')
  // Remote images are never fetched.
  expect(article.querySelector('img')).toBeNull()
  // Only web links keep a target, always in a new unlinked tab.
  const docs = article.querySelector('a[href="https://example.com/docs"]')!
  expect(docs.getAttribute('target')).toBe('_blank')
  expect(docs.getAttribute('rel')).toBe('noopener noreferrer')
  const anchors = [...article.querySelectorAll('a')]
  expect(anchors.map((anchor) => anchor.getAttribute('href'))).toEqual([
    'https://example.com/docs',
    null,
    null,
  ])
  // Raw HTML is dropped, never parsed.
  expect(article.querySelector('[onclick], b')).toBeNull()
  expect(article.textContent).not.toContain('raw block')
  expect(article.textContent).toContain('inline')
  // The file carries its type tile.
  expect(
    container.querySelector('[data-slot="file-kind-tile"]')?.textContent,
  ).toBe('MD')
})

it('shows non-Markdown text as source', async () => {
  await show('scripts/run.py', 'print("<b>hi</b>")')
  expect(container.querySelector('article')).toBeNull()
  expect(container.querySelector('pre')?.textContent).toBe('print("<b>hi</b>")')
})
