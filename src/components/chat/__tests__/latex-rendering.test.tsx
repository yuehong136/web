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

  it.each([
    String.raw`before \\(\\Delta = b^2\\) between \\(x &lt; y\\) after`,
    String.raw`\\[E = mc^2\\]` + '\n\n' + String.raw`\\[x &gt; y\\]`,
    String.raw`\\(\\frac{1}{|y|} + \\left(x\\right)\\) and \(b\)`,
  ])('renders separate doubled formulas: %s', async (content) => {
    await render(content)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    expect(container.querySelector('.katex-error')).toBeNull()
    expect(container.textContent).not.toContain('\\Delta')
    if (content.includes('between')) {
      expect(container.textContent).toContain('between')
      expect(container.querySelector('.katex')?.textContent).not.toContain(
        'between',
      )
    }
  })

  it.each([
    String.raw`\(x &lt; y &gt; z\)`,
    String.raw`\\(x &lt; y &gt; z\\)`,
    '$x &lt; y &gt; z$',
    String.raw`\[\begin{aligned}a &amp;= b\\ c &amp;= d\end{aligned}\]`,
    '$$\n\\begin{aligned}a &amp;= b\\\\ c &amp;= d\\end{aligned}\n$$',
  ])('decodes entities only as KaTeX input: %s', async (content) => {
    await render(content)
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
    expect(container.querySelector('.katex-error')).toBeNull()
    expect(container.textContent).not.toMatch(/&(?:lt|gt|amp);/)
  })

  it('preserves correct commands and matrix row breaks across rerenders', async () => {
    const content = String.raw`\[\begin{matrix}a&b\\c&d\end{matrix}\] and $\Delta$`
    await render(content)
    const first = container.querySelector('.katex')?.outerHTML
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    expect(container.querySelector('.katex-error')).toBeNull()
    await render(content, true)
    await render(content)
    expect(container.querySelector('.katex')?.outerHTML).toBe(first)
  })

  it('decodes exactly one entity layer without feeding rendered output back in', async () => {
    const content = String.raw`\(\text{\&amp;lt;}\)`
    await render(content)
    expect(container.querySelector('.katex-error')).toBeNull()
    expect(container.querySelector('.katex')?.textContent).toBe('&lt;')
    await render(content, true)
    await render(content)
    expect(container.querySelector('.katex')?.textContent).toBe('&lt;')
  })

  it('completes doubled delimiters and split entities during streaming', async () => {
    const prefix = String.raw`\\(a\\) between \\(x &l`
    await render(prefix, true)
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
    await render(prefix + String.raw`t; y\\`, true)
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
    await render(prefix + String.raw`t; y\\)`, true)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    await render(prefix + String.raw`t; y\\)`)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    expect(container.querySelector('.katex-error')).toBeNull()
    expect(container.textContent).toContain('<')
  })

  it('keeps doubled formulas and entities literal in all code forms', async () => {
    const code = String.raw`\\(\\Delta &lt; y\\) &amp; &gt;`
    await render('`' + code + '`\n\n```text\n' + code + '\n```\n\n    ' + code)
    expect(container.querySelector('.katex')).toBeNull()
    expect(
      [...container.querySelectorAll('code')].map((node) =>
        node.textContent?.trim(),
      ),
    ).toEqual([code, code, code])
  })

  it('preserves a doubled block while the next block streams', async () => {
    const prefix = String.raw`\\[a\\]` + '\n\n' + String.raw`\\[\\frac{x`
    await render(prefix, true)
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
    // XMarkdown buffers a trailing [...] as a possible Markdown link until a
    // newline or final frame. Use a block boundary while the stream continues.
    await render(prefix + String.raw`}{y}\\]` + '\n', true)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    await render(prefix + String.raw`}{y}\\]`)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    expect(container.querySelector('.katex-error')).toBeNull()
  })

  it('keeps encoded HTML as text and sanitizes raw HTML and KaTeX errors', async () => {
    await render(
      'a &lt; b &amp; c &gt; d\n\n' +
        '&lt;em&gt;literal&lt;/em&gt; &lt;img src=x onerror=alert(1)&gt;\n\n' +
        '<script>alert(1)</script><img src=x onerror=alert(1)>\n\n' +
        String.raw`\\(&lt;img src=x onerror=alert(1)&gt;\\)`,
    )
    expect(container.textContent).toContain('a < b & c > d')
    expect(container.textContent).toContain('<em>literal</em>')
    expect(container.querySelector('em, script, [onerror]')).toBeNull()
    // Only the original raw HTML image may exist, never an entity-decoded one.
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(container.querySelectorAll('.katex')).toHaveLength(1)
  })
})
