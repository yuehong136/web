import React from 'react'
import markdownit from 'markdown-it'
import type { Config } from 'dompurify'
import { SafeHtml } from '@/components/ui/safe-html'
import { DEFAULT_PROLOGUE } from './constants'
import type { PreviewMessage } from './types'

const md = markdownit({ html: true, breaks: true, linkify: true })

// 预览消息是模型输出（不可信），markdown-it 开了 html:true，必须净化后渲染。
const MARKDOWN_PURIFY_OPTIONS: Config = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['target', 'rel'],
}

export const renderMarkdown = (content: string | React.ReactNode) => {
  if (!content || typeof content !== 'string') {
    return content
  }

  return (
    <SafeHtml
      html={md.render(content)}
      options={MARKDOWN_PURIFY_OPTIONS}
      className="prose prose-sm max-w-none"
      style={
        {
          '--tw-prose-body': 'var(--color-text-primary)',
          '--tw-prose-headings': 'var(--color-text-primary)',
          '--tw-prose-links': 'var(--color-text-accent)',
          '--tw-prose-bold': 'var(--color-text-primary)',
          '--tw-prose-code': 'var(--color-text-primary)',
          '--tw-prose-quotes': 'var(--color-text-secondary)',
          '--tw-prose-quote-borders': 'var(--color-border-default)',
          '--tw-prose-pre-bg': 'var(--color-components-pre-bg)',
          '--tw-prose-pre-code': 'var(--color-components-pre-text)',
        } as React.CSSProperties
      }
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
