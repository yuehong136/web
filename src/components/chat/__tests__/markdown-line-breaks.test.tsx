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
vi.mock('../MarkdownArtifact', () => ({
  MemoizedMarkdownArtifactImage: () => null,
  MemoizedMarkdownArtifactLink: () => null,
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
