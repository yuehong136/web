/**
 * Think 内容处理工具函数
 * 用于从 AI 响应中提取和处理思考内容
 */

/**
 * 思考状态类型
 * - 'none': 无思考内容
 * - 'thinking': 正在思考中（有开标签但无闭标签）
 * - 'complete': 思考完成（有完整的开闭标签）
 */
export type ThinkingStatus = 'none' | 'thinking' | 'complete'

/**
 * 思考内容提取结果
 */
export interface ThinkExtractResult {
  /** 思考内容（think 标签内的文本） */
  thinkContent: string
  /** 主要内容（think 标签外的文本） */
  mainContent: string
  /** 
   * 是否正在思考中
   * @deprecated 使用 status 代替
   */
  isThinking: boolean
  /** 思考状态 */
  status: ThinkingStatus
}

/**
 * 提取 think 内容
 * 从 AI 响应中提取思考内容和主要内容
 * 
 * 支持两种格式的 think 标签：
 * - `<think>...</think>`
 * - `<thinking>...</thinking>`
 * 
 * @param content AI 响应的原始内容
 * @returns 提取结果，包含思考内容、主要内容和状态
 * 
 * @example
 * // 完整的思考标签
 * extractThinkContent('<think>思考中...</think>回答内容')
 * // { thinkContent: '思考中...', mainContent: '回答内容', isThinking: false, status: 'complete' }
 * 
 * @example
 * // 未闭合的思考标签（流式输出中）
 * extractThinkContent('<think>正在思考')
 * // { thinkContent: '正在思考', mainContent: '', isThinking: true, status: 'thinking' }
 * 
 * @example
 * // 无思考标签
 * extractThinkContent('普通回答')
 * // { thinkContent: '', mainContent: '普通回答', isThinking: false, status: 'none' }
 */
export const extractThinkContent = (content: string): ThinkExtractResult => {
  if (!content) {
    return { thinkContent: '', mainContent: '', isThinking: false, status: 'none' }
  }

  // 尝试匹配完整的 think/thinking 标签（思考已完成）
  // 支持 <think> 和 <thinking> 两种格式
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
    // 某些模型可能不使用闭标签，而是用双换行分隔
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
