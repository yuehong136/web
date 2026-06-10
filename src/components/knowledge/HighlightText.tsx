import React from 'react'
import type { Config } from 'dompurify'
import { SafeHtml } from '@/components/ui/safe-html'
import './HighlightText.css'

// 检索高亮 HTML 来自后端（文档派生内容，按不可信输入对待），只允许 em 标签
const HIGHLIGHT_PURIFY_OPTIONS: Config = {
  ALLOWED_TAGS: ['em'],
  ALLOWED_ATTR: [],
}

interface HighlightTextProps {
  /**
   * 包含 <em> 标签的 HTML 字符串
   */
  html?: string
  /**
   * 纯文本内容（当没有高亮时使用）
   */
  text?: string
  /**
   * 是否启用高亮
   */
  enableHighlight?: boolean
  /**
   * 自定义 className
   */
  className?: string
  /**
   * 是否截断显示
   */
  truncate?: boolean
  /**
   * 截断长度
   */
  truncateLength?: number
}

/**
 * 截断 HTML 文本，保持标签完整性
 * @param html HTML 字符串
 * @param maxLength 最大长度（按纯文本计算）
 * @returns 截断后的 HTML 字符串
 */
const truncateHtml = (html: string, maxLength: number): string => {
  // 移除 HTML 标签计算纯文本长度
  const textContent = html.replace(/<[^>]*>/g, '')

  if (textContent.length <= maxLength) {
    return html
  }

  // 需要截断，找到合适的截断位置
  let charCount = 0
  let result = ''
  let inTag = false

  for (let i = 0; i < html.length; i++) {
    const char = html[i]

    if (char === '<') {
      inTag = true
    } else if (char === '>') {
      inTag = false
      result += char
      continue
    }

    if (!inTag && charCount < maxLength) {
      charCount++
    }

    result += char

    if (charCount >= maxLength && !inTag) {
      break
    }
  }

  // 关闭未闭合的 em 标签
  const openTags = (result.match(/<em>/g) || []).length
  const closeTags = (result.match(/<\/em>/g) || []).length
  const unclosedTags = openTags - closeTags

  for (let i = 0; i < unclosedTags; i++) {
    result += '</em>'
  }

  return result + '...'
}

/**
 * 高亮文本组件
 * 用于渲染包含 <em> 标签的 HTML 内容，将 <em> 标签内的文本高亮显示
 *
 * 后端返回的 highlight 字段格式示例：
 * "<em><em>段落</em>风<em>格</em></em>、数据引用不统一...缺乏可控的大纲—章节—<em>段落</em>数据模型"
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  html,
  text,
  enableHighlight = true,
  className = '',
  truncate = false,
  truncateLength = 200,
}) => {
  // 确定要显示的内容
  let content = ''
  if (enableHighlight && html) {
    content = html
  } else if (text) {
    content = text
  }

  // 截断处理
  if (truncate && content) {
    if (enableHighlight && html) {
      // 对 HTML 进行智能截断，保持标签完整性
      content = truncateHtml(content, truncateLength)
    } else if (content.length > truncateLength) {
      // 纯文本简单截断
      content = content.substring(0, truncateLength) + '...'
    }
  }

  return (
    <SafeHtml
      className={`highlight-text ${className}`}
      html={content}
      options={HIGHLIGHT_PURIFY_OPTIONS}
    />
  )
}
