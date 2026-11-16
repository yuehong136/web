import type { BubbleListProps, BubbleProps } from '@ant-design/x'

/**
 * The shared thread look on antd-x: answers without a bubble or avatar, user
 * turns as a compact subtle bubble (`chat-user-bubble`), actions outside.
 */
export const CHAT_BUBBLE_ROLES = {
  user: {
    placement: 'end',
    variant: 'borderless',
    classNames: { content: 'chat-user-bubble' },
    footerPlacement: 'outer-end',
  },
  assistant: {
    placement: 'start',
    variant: 'borderless',
    classNames: { content: 'chat-answer-bubble' },
    footerPlacement: 'outer-start',
  },
} satisfies NonNullable<BubbleListProps['role']>

export const CHAT_TEXT_TYPING = {
  effect: 'typing',
  step: 4,
  interval: 35,
  keepPrefix: true,
} satisfies NonNullable<BubbleProps['typing']>

const MAX_TYPING_TEXT_LENGTH = 160

const RICH_CONTENT_PATTERNS = [
  /```/,
  /`[^`\n]+`/,
  /^#{1,6}\s/m,
  /^\s*[-*+]\s+/m,
  /^\s*\d+\.\s+/m,
  /^\s*>\s+/m,
  /\|.+\|/,
  /!\[[^\]]*]\([^)]*\)/,
  /\[[^\]]+]\([^)]*\)/,
  /<\/?[a-z][\s\S]*>/i,
  /\[ID:\d+]/,
  /<sup\b/i,
  /<think\b/i,
  /<tool/i,
  /<carousel-placeholder\b/i,
]

export function shouldUseBubbleTyping(content: string): boolean {
  const text = content.trim()

  if (!text || text.length > MAX_TYPING_TEXT_LENGTH) {
    return false
  }

  return !RICH_CONTENT_PATTERNS.some((pattern) => pattern.test(text))
}
