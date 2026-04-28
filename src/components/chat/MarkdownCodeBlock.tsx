import React, { memo } from 'react'
import { CodeHighlighter, Mermaid } from '@ant-design/x'
import type { ComponentProps, XMarkdownProps } from '@ant-design/x-markdown'
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

function normalizeMermaidSource(source: string): string {
  if (!source) return ''

  const normalizedPunctuation = source
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

  return normalizedPunctuation
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('%%')) return line

      if (/^subgraph\s+/i.test(trimmed)) {
        return line.replace(/^(\s*subgraph)\s+["'](.+?)["']\s*$/i, '$1 $2')
      }

      const normalizedEdgeLabel = line.replace(
        /((?:-->|==>|-.->|---|<--|<->|<-->|o-->|x-->|--o|--x)\s*)([A-Za-z][\w-]*)\s+\[/g,
        '$1$2['
      )

      return normalizedEdgeLabel.replace(/^(\s*[A-Za-z][\w-]*)\s+\[/, '$1[')
    })
    .join('\n')
}

const mermaidValidationCache = new Map<string, boolean>()
let mermaidValidatorPromise: Promise<{
  parse: (text: string, options?: { suppressErrors?: boolean }) => Promise<boolean | unknown>
  initialize: (config: Record<string, unknown>) => void
}> | null = null

async function validateMermaidSource(source: string): Promise<boolean> {
  const cached = mermaidValidationCache.get(source)
  if (cached !== undefined) return cached

  try {
    if (!mermaidValidatorPromise) {
      mermaidValidatorPromise = import('mermaid').then((module) => {
        const mermaid = module.default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'default',
          fontFamily: 'monospace',
        })
        return mermaid
      })
    }

    const mermaid = await mermaidValidatorPromise
    const parsed = await mermaid.parse(source, { suppressErrors: true })
    const isValid = parsed !== false
    mermaidValidationCache.set(source, isValid)
    return isValid
  } catch {
    mermaidValidationCache.set(source, false)
    return false
  }
}

const SafeMermaid: React.FC<{ code: string; streamStatus: ComponentProps['streamStatus'] }> = ({
  code,
  streamStatus,
}) => {
  const normalizedCode = React.useMemo(() => normalizeMermaidSource(code), [code])
  const [canRenderMermaid, setCanRenderMermaid] = React.useState<boolean>(() => {
    const cached = mermaidValidationCache.get(normalizedCode)
    return cached ?? true
  })

  React.useEffect(() => {
    let cancelled = false
    const cached = mermaidValidationCache.get(normalizedCode)
    if (cached !== undefined) {
      setCanRenderMermaid(cached)
      return () => {
        cancelled = true
      }
    }

    if (streamStatus === 'loading') {
      setCanRenderMermaid(true)
      return () => {
        cancelled = true
      }
    }

    void validateMermaidSource(normalizedCode).then((isValid) => {
      if (!cancelled) {
        setCanRenderMermaid(isValid)
      }
    })

    return () => {
      cancelled = true
    }
  }, [normalizedCode, streamStatus])

  if (!canRenderMermaid) {
    return <CodeHighlighter lang="mermaid">{normalizedCode}</CodeHighlighter>
  }

  return <Mermaid>{normalizedCode}</Mermaid>
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
const MarkdownCode: React.FC<ComponentProps> = ({
  block,
  className,
  children,
  domNode: _domNode,
  lang: markdownLang,
  streamStatus = 'done',
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

  const lang = markdownLang || parseLang(className)
  const code = extractText(children)

  if (lang === 'mermaid') {
    return <SafeMermaid code={code} streamStatus={streamStatus} />
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
  'incomplete-inline-code': memo(IncompleteMarkdownToken),
}

export function getMarkdownStreamingOptions(isStreaming: boolean): XMarkdownProps['streaming'] {
  if (isStreaming) {
    return {
      hasNextChunk: true,
      enableAnimation: true,
      tail: true,
    }
  }

  return {
    hasNextChunk: false,
  }
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
