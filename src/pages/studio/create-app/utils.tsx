import React from 'react'
import markdownit from 'markdown-it'
import { DEFAULT_PROLOGUE } from './constants'
import type { PreviewMessage } from './types'

const md = markdownit({ html: true, breaks: true, linkify: true })

export const renderMarkdown = (content: string | React.ReactNode) => {
  if (!content || typeof content !== 'string') {
    return content
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: md.render(content) }}
      className="prose prose-sm max-w-none"
      style={{
        '--tw-prose-body': 'var(--color-text-primary)',
        '--tw-prose-headings': 'var(--color-text-primary)',
        '--tw-prose-links': 'var(--color-text-accent)',
        '--tw-prose-bold': 'var(--color-text-primary)',
        '--tw-prose-code': 'var(--color-text-primary)',
        '--tw-prose-quotes': 'var(--color-text-secondary)',
        '--tw-prose-quote-borders': 'var(--color-border-default)',
        '--tw-prose-pre-bg': 'var(--color-components-pre-bg)',
        '--tw-prose-pre-code': 'var(--color-components-pre-text)',
      } as React.CSSProperties}
    />
  )
}

export const buildPrologueMessages = (prologue?: string): PreviewMessage[] => {
  const content = prologue || DEFAULT_PROLOGUE

  if (!content) {
    return []
  }

  return [
    {
      role: 'assistant',
      content,
      id: `prologue-${Date.now()}`,
    },
  ]
}
