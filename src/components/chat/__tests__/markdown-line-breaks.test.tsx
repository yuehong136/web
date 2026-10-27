import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MdPreview } from '@/components/knowledge/document-preview/components/text-preview'
import {
  markdownConfig,
  markdownStreamingComponents,
} from '../MarkdownCodeBlock'
import { StreamingXMarkdown } from '../streaming-x-markdown'

vi.mock('../CodeBlock', () => ({
  CodeBlock: ({ code, language }: { code: string; language: string }) => (
    <pre data-language={language}>{code}</pre>
  ),
}))
vi.mock('@ant-design/x', () => ({
  Mermaid: ({ children }: { children: string }) => (
    <pre data-mermaid>{children}</pre>
  ),
}))

describe('Markdown newline contracts', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })
  async function chat(content: string, streaming = false) {
    await act(async () =>
      root.render(
        <StreamingXMarkdown
          content={content}
          isStreaming={streaming}
          config={markdownConfig}
          components={markdownStreamingComponents}
        />,
      ),
    )
    await act(async () => {
      await new Promise(requestAnimationFrame)
    })
  }

  it('renders raster data images in streaming and history without allowing unsafe sources or links', async () => {
    const image =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
    const content = `![plot](${image})\n\n![web](https://example.com/image.png)\n\n![svg](data:image/svg+xml;base64,PHN2Zy8+)\n\n![html](data:text/html;base64,PHNjcmlwdD4=)\n\n![malformed](data:image/png;base64,!!!!)\n\n[blocked](data:text/html;base64,PHNjcmlwdD4=)\n\n[web link](https://example.com)\n\n<img src="data:image/svg+xml;base64,PHN2Zy8+" onerror="alert(1)"><script>alert(1)</script>`
    for (const streaming of [true, false]) {
      await chat(content, streaming)
      expect(
        container.querySelector('img[alt="plot"]')?.getAttribute('src'),
      ).toBe(image)
      expect(
        container.querySelector('img[alt="web"]')?.getAttribute('src'),
      ).toBe('https://example.com/image.png')
      expect(container.querySelectorAll('img[src^="data:"]')).toHaveLength(1)
      expect(container.querySelector('a[href^="data:"]')).toBeNull()
      expect(container.querySelector('script, [onerror], svg')).toBeNull()
      expect(
        container.querySelector('a[href="https://example.com"]'),
      ).not.toBeNull()
    }
  })

  it('renders a single newline as a break during streaming and after finalization', async () => {
    await chat('first\nsecond\n', true)
    expect(container.querySelectorAll('br')).toHaveLength(1)
    await chat('first\nsecond')
    expect(container.querySelectorAll('br')).toHaveLength(1)
    expect(container.textContent).toBe('firstsecond\n')
  })

  it('keeps tables, lists, math and fenced source intact', async () => {
    await chat(
      '| a | b |\n| - | - |\n| 1 | 2 |\n\n- [x] done\n\n$a+b$\n\n```text\nfirst\nsecond\n```',
    )
    expect(container.querySelectorAll('table')).toHaveLength(1)
    expect(
      container
        .querySelector('input[type="checkbox"]')
        ?.hasAttribute('checked'),
    ).toBe(true)
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
    expect(container.querySelector('[data-language="text"]')?.textContent).toBe(
      'first\nsecond\n',
    )
    expect(container.querySelector('pre br')).toBeNull()
  })

  it('routes fenced mermaid using XMarkdown lang metadata', async () => {
    await chat('```mermaid\ngraph LR\nA-->B\n```', true)
    expect(container.querySelector('[data-mermaid]')?.textContent).toBe(
      'graph LR\nA-->B\n',
    )
    expect(container.querySelector('[data-language="mermaid"]')).toBeNull()
  })

  it('adds breaks in MD preview while preserving GFM, code and safe HTML handling', async () => {
    await act(async () =>
      root.render(
        <MdPreview
          sourceUrl="/fixture.md"
          content={
            'first\nsecond\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n```text\nfirst\nsecond\n```\n\n<script>alert(1)</script>\n[bad](javascript:alert(1))'
          }
        />,
      ),
    )
    expect(container.querySelectorAll('br')).toHaveLength(1)
    expect(container.querySelectorAll('table')).toHaveLength(1)
    expect(container.querySelector('pre code')?.textContent).toBe(
      'first\nsecond\n',
    )
    expect(
      container.querySelector('script, [onerror], a[href^="javascript:"]'),
    ).toBeNull()
    expect(container.querySelector('.katex')).toBeNull()
  })
})
