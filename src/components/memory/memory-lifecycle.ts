import type { MemoryMessage } from '@/types/memory'

export type MemoryLifecycle = 'enabled' | 'disabled' | 'forgotten'

// Keep the upstream distinction: forgetting a source does not forget its extracts.
export function getMemoryLifecycle(message: MemoryMessage): MemoryLifecycle {
  if (message.forget_at && message.forget_at !== 'None') return 'forgotten'
  return message.status ? 'enabled' : 'disabled'
}

export function getMemoryEntries(sources: MemoryMessage[]) {
  return sources.flatMap((source) =>
    (source.extract ?? []).map((message) => ({ message, source })),
  )
}

export function parseMemoryConversation(content = '') {
  const boundary = content.indexOf('Agent Response:')
  if (boundary < 0) return { user: '', answer: content }
  const response = content.slice(boundary + 'Agent Response:'.length).trim()
  const thinkingEnd = response.indexOf('</think>')
  return {
    user: content
      .slice(0, boundary)
      .replace(/^User Input:\s*/, '')
      .trim(),
    answer:
      response.startsWith('<think>') && thinkingEnd >= 0
        ? response.slice(thinkingEnd + '</think>'.length).trim()
        : response,
  }
}
