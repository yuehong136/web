/**
 * 消息处理工具函数
 * 用于处理聊天消息中的引用格式转换、图片轮播等功能
 */

import { 
  groupConsecutiveReferences, 
  shouldShowCarousel,
  type ReferenceGroup 
} from './reference-utils'
import type { ReferenceChunk } from './reference-replacer'

/**
 * 处理后的内容类型
 */
export interface ProcessedContent {
  /** 处理后的内容（连续图片引用被替换为占位符） */
  content: string
  /** 需要渲染为轮播的分组（按顺序） */
  carouselGroups: ReferenceGroup[]
}

/**
 * 将内容中的 [ID:x] 引用转换为 <sup>x</sup> 格式
 * 供 XMarkdown 组件处理渲染为上标引用标记
 * 
 * @param content 原始内容
 * @returns 转换后的内容
 * 
 * @example
 * convertReferencesToSup('文本[ID:0]更多[ID:1]')
 * // 返回: '文本<sup>0</sup>更多<sup>1</sup>'
 */
export const convertReferencesToSup = (content: string): string => {
  if (!content) return ''
  return content.replace(/\[ID:(\d+)\]/g, '<sup>$1</sup>')
}

/**
 * 处理内容中的引用，将连续图片引用替换为轮播占位符
 * 返回处理后的内容和需要渲染的轮播组信息
 * 
 * @param content 原始内容
 * @param references 引用 chunk 数据
 * @returns 处理结果，包含处理后的内容和轮播组
 * 
 * @example
 * const { content, carouselGroups } = processContentForCarousel(
 *   '图片[ID:0][ID:1][ID:2]文字',
 *   references
 * )
 * // content: '图片<carousel-placeholder></carousel-placeholder>文字'
 * // carouselGroups: [[ref0, ref1, ref2]]
 */
export const processContentForCarousel = (
  content: string, 
  references: ReferenceChunk[]
): ProcessedContent => {
  if (!content || references.length === 0) {
    return { content, carouselGroups: [] }
  }

  const groups = groupConsecutiveReferences(content)
  const carouselGroups: ReferenceGroup[] = []
  let processedContent = content

  // 从后往前处理，避免位置偏移问题
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]
    if (shouldShowCarousel(group, references)) {
      carouselGroups.unshift(group) // 保持顺序
      
      // 计算要替换的文本范围
      const startPos = group[0].start
      const endPos = group[group.length - 1].end
      
      // 替换为占位符标记（用于分割内容）
      processedContent = 
        processedContent.slice(0, startPos) + 
        '<carousel-placeholder></carousel-placeholder>' +
        processedContent.slice(endPos)
    }
  }

  return { content: processedContent, carouselGroups }
}

/**
 * 轮播占位符标记
 * 用于在处理后的内容中标识轮播位置
 */
export const CAROUSEL_PLACEHOLDER = '<carousel-placeholder></carousel-placeholder>'

/**
 * 检查内容是否包含轮播占位符
 */
export const hasCarouselPlaceholder = (content: string): boolean => {
  return content.includes(CAROUSEL_PLACEHOLDER)
}

/**
 * 按轮播占位符分割内容
 * 返回内容片段数组，用于在占位符位置插入轮播组件
 */
export const splitByCarouselPlaceholder = (content: string): string[] => {
  return content.split(CAROUSEL_PLACEHOLDER)
}
