import type { ThinkExtractResult } from '../types'

/**
 * 提取 think 内容
 * 从 AI 响应中提取思考内容和主要内容
 */
export const extractThinkContent = (content: string): ThinkExtractResult => {
  if (!content) {
    return { thinkContent: '', mainContent: '', isThinking: false, status: 'none' }
  }

  // 尝试匹配完整的 think 标签
  const completeMatch = content.match(/<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>([\s\S]*)/)
  if (completeMatch) {
    return {
      thinkContent: completeMatch[1].trim(),
      mainContent: completeMatch[2].trim(),
      isThinking: false,
      status: 'complete'
    }
  }

  // 检查是否有开标签但没有闭标签（正在思考中）
  const hasOpenTag = content.includes('<think>') || content.includes('<thinking>')
  const hasCloseTag = content.includes('</think>') || content.includes('</thinking>')

  if (hasOpenTag && !hasCloseTag) {
    const openMatch = content.match(/<think(?:ing)?>([\s\S]*)/)
    const afterTag = openMatch ? openMatch[1] : ''
    
    // 检查是否通过双换行分隔思考内容和主要内容
    const doubleNewlineMatch = afterTag.match(/^([\s\S]*?)\n\n+(\S[\s\S]*)$/)

    if (doubleNewlineMatch) {
      return {
        thinkContent: doubleNewlineMatch[1].trim(),
        mainContent: doubleNewlineMatch[2].trim(),
        isThinking: false,
        status: 'complete'
      }
    }

    return {
      thinkContent: afterTag.trim(),
      mainContent: '',
      isThinking: true,
      status: 'thinking'
    }
  }

  // 没有 think 标签
  return { thinkContent: '', mainContent: content, isThinking: false, status: 'none' }
}
