import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import i18n from '@/locales/i18n'
import { MdPreview, safeMarkdownUrl } from '../components/text-preview'

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
})

it('keeps relative and web URLs and drops other schemes', () => {
  expect(safeMarkdownUrl('./a.md')).toBe('./a.md')
  expect(safeMarkdownUrl('#intro')).toBe('#intro')
  expect(safeMarkdownUrl('/docs/a?x=1:2')).toBe('/docs/a?x=1:2')
  expect(safeMarkdownUrl('https://example.com')).toBe('https://example.com')
  expect(safeMarkdownUrl('MAILTO:a@example.com')).toBe('MAILTO:a@example.com')
  expect(safeMarkdownUrl('javascript:alert(1)')).toBeUndefined()
  expect(safeMarkdownUrl(' javascript:alert(1)')).toBeUndefined()
  expect(safeMarkdownUrl('data:image/png;base64,AAAA')).toBeUndefined()
  expect(safeMarkdownUrl('vbscript:x')).toBeUndefined()
  expect(safeMarkdownUrl('')).toBeUndefined()
})

it('renders Markdown documents with safe links and images', async () => {
  await act(async () =>
    root.render(
      <MdPreview
        sourceUrl="/fixture.md"
        content={[
          '# Title',
          '',
          '[site](https://example.com) [next](./next.md) [bad](javascript:alert(1))',
          '',
          '![chart](https://example.com/chart.png) ![inline](data:image/png;base64,AAAA)',
          '',
          '<img src="x" onerror="alert(1)">',
          '',
          '$a+b$',
        ].join('\n')}
      />,
    ),
  )

  expect(container.querySelector('h1')?.textContent).toBe('Title')
  const site = container.querySelector('a[href="https://example.com"]')!
  expect(site.getAttribute('target')).toBe('_blank')
  expect(site.getAttribute('rel')).toBe('noopener noreferrer')
  const next = container.querySelector('a[href="./next.md"]')!
  expect(next.getAttribute('target')).toBeNull()
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull()
  const images = [...container.querySelectorAll('img')]
  expect(images.map((image) => image.getAttribute('src'))).toEqual([
    'https://example.com/chart.png',
  ])
  // Raw HTML stays visible as text, never a live element.
  expect(container.querySelector('[onerror]')).toBeNull()
  expect(container.textContent).toContain('<img src="x" onerror="alert(1)">')
  // TeX stays literal in document previews.
  expect(container.querySelector('.katex')).toBeNull()
  expect(container.textContent).toContain('$a+b$')
})

it('shows the file type tile when the text cannot be loaded', async () => {
  await act(async () =>
    root.render(<MdPreview sourceUrl="/fixture.md" content={undefined} />),
  )
  const tile = container.querySelector('[data-slot="file-kind-tile"]')
  expect(tile?.textContent).toBe('MD')
  expect(
    container.querySelector('a[href="/fixture.md"][target="_blank"]'),
  ).not.toBeNull()
})
