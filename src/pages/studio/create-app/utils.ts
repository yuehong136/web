import { DEFAULT_PROLOGUE } from './constants'
import type { PreviewMessage } from './types'

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
