import React, { memo } from 'react'
import { CodeHighlighter, Mermaid } from '@ant-design/x'
import type { ComponentProps } from '@ant-design/x-markdown'
import type { MarkedExtension } from 'marked'
import Latex from '@ant-design/x-markdown/plugins/Latex'

/**
 * Extract plain text from React children (may be string, element tree, or mixed).
 * CodeHighlighter and Mermaid expect a `string` child.
 */
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (React.isValidElement(children)) {
    return extractText((children.props as Record<string, unknown>).children as React.ReactNode)
  }
  return ''
}

/**
 * Parse language string from className like "language-python" → "python"
 */
function parseLang(className?: string): string {
  if (!className) return ''
  const match = className.match(/language-(\S+)/)
  return match?.[1] || ''
}

/**
 * Custom code component for XMarkdown.
 *
 * XMarkdown passes `block: true` for fenced code blocks (```lang),
 * and `block: false/undefined` for inline code (`code`).
 *
 * For block code:
 *   - language "mermaid" → renders interactive Mermaid diagram
 *   - other languages → renders CodeHighlighter with syntax highlighting
 * For inline code:
 *   - renders styled <code> tag
 */
const MarkdownCode: React.FC<ComponentProps & { block?: boolean }> = ({
  block,
  className,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  domNode: _domNode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  streamStatus: _streamStatus,
  ...rest
}) => {
  if (!block) {
    return (
      <code
        className="bg-[var(--color-components-code-bg)] text-[var(--color-components-code-text)] border border-[var(--color-components-code-border)] px-1.5 py-0.5 rounded text-sm font-mono"
        {...rest}
      >
        {children}
      </code>
    )
  }

  const lang = parseLang(className)
  const code = extractText(children)

  if (lang === 'mermaid') {
    return <Mermaid>{code}</Mermaid>
  }

  return <CodeHighlighter lang={lang}>{code}</CodeHighlighter>
}

/**
 * Transparent pre wrapper.
 *
 * XMarkdown renders fenced code as <pre><code ...>...</code></pre>.
 * Since CodeHighlighter and Mermaid render their own containers,
 * we strip the <pre> wrapper to avoid double-wrapping.
 */
const MarkdownPre: React.FC<ComponentProps> = ({ children }) => {
  return <>{children}</>
}

function getStreamingPendingText(domNode: ComponentProps['domNode']): string {
  const raw = (domNode as { attribs?: Record<string, string> })?.attribs?.['data-raw']
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

const IncompleteMarkdownToken: React.FC<ComponentProps> = ({ domNode }) => {
  const pendingText = getStreamingPendingText(domNode)
  if (!pendingText) return null

  return (
    <span className="text-text-tertiary whitespace-pre-wrap">
      {pendingText}
    </span>
  )
}

/**
 * Base components map for XMarkdown integration.
 * Merge with additional components (like `sup` for references) when needed:
 *
 * ```tsx
 * <XMarkdown components={{ ...markdownCodeComponents, sup: SupComponent }}>
 * ```
 */
export const markdownCodeComponents: Record<string, React.ComponentType<ComponentProps>> = {
  pre: memo(MarkdownPre),
  code: memo(MarkdownCode),
}

/**
 * Components map with placeholders for incomplete markdown tokens during streaming.
 * This keeps the "typing" feel while allowing XMarkdown to finalize syntax safely.
 */
export const markdownStreamingComponents: Record<string, React.ComponentType<ComponentProps>> = {
  ...markdownCodeComponents,
  'incomplete-link': memo(IncompleteMarkdownToken),
  'incomplete-image': memo(IncompleteMarkdownToken),
  'incomplete-html': memo(IncompleteMarkdownToken),
  'incomplete-emphasis': memo(IncompleteMarkdownToken),
  'incomplete-list': memo(IncompleteMarkdownToken),
  'incomplete-table': memo(IncompleteMarkdownToken),
}

/**
 * Marked.js config with Latex plugin for XMarkdown.
 * Enables inline ($...$) and block ($$...$$) LaTeX formula rendering via KaTeX.
 *
 * ```tsx
 * <XMarkdown config={markdownConfig} components={markdownCodeComponents}>
 * ```
 */
export const markdownConfig: MarkedExtension = {
  extensions: Latex(),
}
