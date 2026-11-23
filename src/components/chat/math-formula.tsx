import { Children, isValidElement, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Config } from 'dompurify'
import type KaTeX from 'katex'
import { SafeHtml } from '@/components/ui/safe-html'
import type { MathDisplay } from './latex-extension'

type Katex = typeof KaTeX

let katex: Katex | undefined
let loading: Promise<Katex> | undefined

/** KaTeX and its stylesheet load once, the first time a formula renders. */
function loadKatex(): Promise<Katex> {
  loading ??= Promise.all([
    import('katex'),
    import('katex/dist/katex.min.css'),
  ]).then(([module]) => {
    katex = module.default
    return katex
  })
  return loading
}

/** KaTeX HTML output: spans with inline styles, and SVG for stretchy parts. */
const KATEX_HTML: Config = { USE_PROFILES: { html: true, svg: true } }

const textOf = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : '',
    )
    .join('')

/**
 * Renders a `<math-formula>` placeholder from the chat Markdown. Until KaTeX
 * has loaded (usually one frame after the first formula) the TeX source shows
 * in the code font, so a streamed formula never flashes empty.
 */
export function MathFormula({
  children,
  'data-display': display = 'inline',
}: {
  children?: ReactNode
  'data-display'?: MathDisplay
}) {
  const tex = textOf(children)
  const [ready, setReady] = useState<Katex | undefined>(katex)
  useEffect(() => {
    if (ready) return
    let active = true
    void loadKatex().then((module) => {
      if (active) setReady(module)
    })
    return () => {
      active = false
    }
  }, [ready])

  if (!ready)
    return (
      <code
        data-math-pending=""
        className={display === 'block' ? 'block font-mono' : 'font-mono'}
      >
        {tex}
      </code>
    )
  // KaTeX escapes TeX text itself; its output still passes DOMPurify.
  const html = ready.renderToString(tex, {
    displayMode: true,
    output: 'html',
    throwOnError: false,
  })
  if (display === 'block') return <SafeHtml html={html} options={KATEX_HTML} />
  return (
    <SafeHtml
      as="span"
      className={display === 'block-inline' ? 'block-katex' : 'inline-katex'}
      html={html}
      options={KATEX_HTML}
    />
  )
}
