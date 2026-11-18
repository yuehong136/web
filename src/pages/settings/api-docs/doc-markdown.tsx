import { memo, type ReactNode } from 'react'
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown'
import { cn } from '@/lib/utils'

const SAFE_LINK = /^(https?:|mailto:)/i

/** Spec links open in a new tab and only for http(s)/mailto targets. */
const DocLink = ({
  href,
  children,
}: ComponentProps<{ href?: string; children?: ReactNode }>) =>
  href && SAFE_LINK.test(href) ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-fg underline underline-offset-2"
    >
      {children}
    </a>
  ) : (
    <span>{children}</span>
  )

const COMPONENTS = { a: DocLink }
const STATIC = { hasNextChunk: false }

/**
 * API descriptions rendered by the shared x-markdown renderer. Raw HTML in
 * the spec is shown as text, never parsed.
 */
export const DocMarkdown = memo(function DocMarkdown({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <XMarkdown
      className={cn('text-sm text-fg-muted', className)}
      components={COMPONENTS}
      streaming={STATIC}
      escapeRawHtml
    >
      {content}
    </XMarkdown>
  )
})
