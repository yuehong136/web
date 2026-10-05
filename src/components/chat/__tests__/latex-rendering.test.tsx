import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { markdownConfig } from '../MarkdownCodeBlock'
import { StreamingXMarkdown } from '../streaming-x-markdown'

// Code highlighting is unrelated; keep XMarkdown and its LaTeX plugin real.
vi.mock('../CodeBlock', () => ({ CodeBlock: () => null }))
vi.mock('@ant-design/x', () => ({ Mermaid: () => null }))
vi.mock('../MarkdownArtifact', () => ({
  MemoizedMarkdownArtifactImage: () => null,
  MemoizedMarkdownArtifactLink: () => null,
}))

describe('shared chat LaTeX renderer', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  async function render(content: string, isStreaming = false) {
    await act(async () => {
      root.render(
        <StreamingXMarkdown
          content={content}
          isStreaming={isStreaming}
          config={markdownConfig}
        />,
      )
    })
    // Flush the production frame throttle and XMarkdown's effect-driven parser.
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })
  }

  it.each([
    [String.raw`before \(a\) between \(b\) after`, 2],
    [String.raw`before $a$ between $b$ after`, 2],
    [String.raw`\[a\]` + '\n\n' + String.raw`\[b\]`, 2],
    ['$$\na\n$$\n\n$$\nb\n$$', 2],
    [String.raw`\(f(x)=\left(\frac{1}{|y|}\right)\) and \(b\)`, 2],
    [
      String.raw`\[f[x]=\left[\frac{1}{|y|}\right]\]` +
        '\n\n' +
        String.raw`\[b\]`,
      2,
    ],
  ])('renders separate formulas: %s', async (content, count) => {
    await render(content)
    expect(container.querySelectorAll('.katex')).toHaveLength(count)
    expect(container.querySelector('.katex-error')).toBeNull()
    if (content.includes('between')) {
      expect(container.textContent).toContain('between')
      expect(container.querySelector('.katex')?.textContent).not.toContain(
        'between',
      )
    }
  })

  it('keeps an incomplete streamed formula separate and completes it later', async () => {
    await render(String.raw`\(a\) between \(\frac{b`, true)
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
    expect(container.textContent).toContain('between')
    await render(String.raw`\(a\) between \(\frac{b}{c}\)`, true)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    await render(String.raw`\(a\) between \(\frac{b}{c}\)`)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    expect(container.querySelector('.katex-error')).toBeNull()
  })

  it('preserves a completed block while the next block streams', async () => {
    await render(String.raw`\[a\]` + '\n\n' + String.raw`\[f(x)=`, true)
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
    await render(String.raw`\[a\]` + '\n\n' + String.raw`\[f(x)=x\]`)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    expect(container.querySelector('.katex-error')).toBeNull()
  })

  it('does not parse formulas inside inline or fenced code', async () => {
    const code = String.raw`\(a\) \[b\] $c$ $$d$$`
    await render(
      '`' + code + '`\n\n```text\n' + code + '\n```\n\n' + String.raw`\(e\)`,
    )
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
    expect(
      [...container.querySelectorAll('code')].map((node) =>
        node.textContent?.trim(),
      ),
    ).toEqual([code, code])
  })
})
