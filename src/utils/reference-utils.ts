/**
 * 引用分组工具函数
 * 用于检测和分组连续出现的引用标记，支持图片轮播功能
 * 以及引用数据的处理和展示辅助函数
 */

import DOMPurify from 'dompurify'
import type { ReferenceChunk } from './reference-replacer'

/**
 * 文档聚合数据类型
 */
export interface DocAgg {
  doc_name: string
  doc_id: string
  count: number
}

/**
 * 引用响应数据类型
 */
export interface ReferenceResponse {
  total: number
  chunks: ReferenceChunk[]
  doc_aggs: DocAgg[]
}

/**
 * 引用匹配结果
 */
export interface ReferenceMatch {
  /** 引用 ID（数字字符串） */
  id: string
  /** 完整匹配的字符串，如 [ID:0] */
  fullMatch: string
  /** 匹配开始位置 */
  start: number
  /** 匹配结束位置 */
  end: number
}

/**
 * 引用分组类型
 */
export type ReferenceGroup = ReferenceMatch[]

/**
 * 引用匹配正则表达式
 * 匹配 [ID:数字] 格式
 */
export const REFERENCE_PATTERN = /\[ID:(\d+)\]/g

/**
 * 查找文本中所有的引用匹配
 * @param text 要搜索的文本
 * @returns 所有引用匹配的数组
 */
export function findAllReferenceMatches(text: string): ReferenceMatch[] {
  const matches: ReferenceMatch[] = []
  const regex = new RegExp(REFERENCE_PATTERN.source, 'g')
  let match

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      id: match[1],
      fullMatch: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  return matches
}

/**
 * 将连续出现的引用分组
 * 
 * 例如：
 * - 输入: "文本[ID:0][ID:1]更多文本[ID:2]"
 * - 输出: [[{id:'0',...}, {id:'1',...}], [{id:'2',...}]]
 * 
 * 判断连续的规则：当前引用的 start 等于上一个引用的 end
 * 
 * @param text 要分析的文本
 * @returns 分组后的引用数组（二维数组）
 */
export function groupConsecutiveReferences(text: string): ReferenceGroup[] {
  const matches = findAllReferenceMatches(text)
  const groups: ReferenceGroup[] = []

  if (matches.length === 0) return groups

  let currentGroup: ReferenceGroup = [matches[0]]

  for (let i = 1; i < matches.length; i++) {
    const prevMatch = currentGroup[currentGroup.length - 1]
    const currentMatch = matches[i]

    // 如果当前引用紧邻上一个引用（end === start），则属于同一组
    if (currentMatch.start === prevMatch.end) {
      currentGroup.push(currentMatch)
    } else {
      // 否则保存当前组并开始新组
      groups.push(currentGroup)
      currentGroup = [currentMatch]
    }
  }

  // 不要忘记最后一组
  groups.push(currentGroup)

  return groups
}

/**
 * 判断图片类型文档
 * 支持 'image' 和 'table' 类型
 */
const IMAGE_DOC_TYPES = ['image', 'table']

/**
 * 判断一个 chunk 是否为图片类型
 * @param chunk 引用 chunk 数据
 * @returns 是否为图片类型
 */
export function isImageChunk(chunk?: ReferenceChunk): boolean {
  if (!chunk?.doc_type) return false
  return IMAGE_DOC_TYPES.includes(chunk.doc_type)
}

/**
 * 判断一个引用分组是否应该显示为轮播
 * 
 * 条件：
 * 1. 分组中至少有 2 个引用
 * 2. 所有引用对应的 chunk 都是图片类型
 * 
 * @param group 引用分组
 * @param chunks 所有引用 chunk 数据
 * @returns 是否应该显示为轮播
 */
export function shouldShowCarousel(
  group: ReferenceGroup,
  chunks: ReferenceChunk[]
): boolean {
  // 至少需要 2 个图片才显示轮播
  if (group.length < 2) return false

  // 检查所有引用是否都是图片类型
  return group.every((ref) => {
    const chunkIndex = parseInt(ref.id, 10)
    const chunk = chunks[chunkIndex]
    return chunk && isImageChunk(chunk)
  })
}

/**
 * 获取引用对应的 chunk 数据
 * @param refId 引用 ID
 * @param chunks 所有引用 chunk 数据
 * @returns chunk 数据或 undefined
 */
export function getChunkByRefId(
  refId: string,
  chunks: ReferenceChunk[]
): ReferenceChunk | undefined {
  const index = parseInt(refId, 10)
  return chunks[index]
}

/**
 * 构建图片 URL
 * @param imageId 图片 ID
 * @returns 完整的图片 URL
 */
export function buildImageUrl(imageId: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  // 注意：API 需要 /v1 版本前缀
  return `${baseUrl}/v1/document/image/${imageId}`
}

/**
 * 处理文本中的引用，返回分组信息和处理后的内容片段
 * 
 * 这个函数用于在渲染前分析文本，将连续图片引用标记出来
 * 以便后续用轮播组件替换
 * 
 * @param text 原始文本
 * @param chunks 引用 chunk 数据
 * @returns 处理结果，包含分组和片段信息
 */
export interface ProcessedReference {
  /** 引用分组 */
  groups: ReferenceGroup[]
  /** 需要显示为轮播的分组索引 */
  carouselGroupIndices: number[]
}

export function processReferenceGroups(
  text: string,
  chunks: ReferenceChunk[]
): ProcessedReference {
  const groups = groupConsecutiveReferences(text)
  const carouselGroupIndices: number[] = []

  groups.forEach((group, index) => {
    if (shouldShowCarousel(group, chunks)) {
      carouselGroupIndices.push(index)
    }
  })

  return {
    groups,
    carouselGroupIndices,
  }
}

// ============================================================
// 引用展示辅助函数
// ============================================================

/**
 * 安全渲染 HTML 内容（用于表格等结构化内容）
 * 使用 DOMPurify 防止 XSS 攻击
 * 
 * @param html 原始 HTML 字符串
 * @param options 可选配置
 * @returns 安全的 HTML 字符串
 */
export function sanitizeHtmlContent(
  html: string,
  options?: {
    allowedTags?: string[]
    allowedAttrs?: string[]
  }
): string {
  const defaultTags = ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'br', 'p', 'div', 'span', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li']
  const defaultAttrs = ['rowspan', 'colspan', 'class', 'style']
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: options?.allowedTags || defaultTags,
    ALLOWED_ATTR: options?.allowedAttrs || defaultAttrs,
  })
}

/**
 * 相似度颜色等级
 */
export type SimilarityLevel = 'high' | 'medium' | 'low'

/**
 * 获取相似度等级
 * @param similarity 相似度值 (0-1)
 * @returns 相似度等级
 */
export function getSimilarityLevel(similarity: number): SimilarityLevel {
  if (similarity >= 0.8) return 'high'
  if (similarity >= 0.6) return 'medium'
  return 'low'
}

/**
 * 获取相似度对应的 CSS 颜色变量
 * @param similarity 相似度值 (0-1)
 * @returns CSS 颜色变量
 */
export function getSimilarityColor(similarity: number): string {
  const level = getSimilarityLevel(similarity)
  switch (level) {
    case 'high':
      return 'var(--color-text-success)'
    case 'medium':
      return 'var(--color-text-accent)'
    case 'low':
      return 'var(--color-text-tertiary)'
  }
}

/**
 * 获取相似度等级标签
 * @param similarity 相似度值 (0-1)
 * @returns 中文等级标签
 */
export function getSimilarityLabel(similarity: number): string {
  const level = getSimilarityLevel(similarity)
  switch (level) {
    case 'high':
      return '高度匹配'
    case 'medium':
      return '较为相关'
    case 'low':
      return '可能相关'
  }
}

/**
 * 文档类型
 */
export type DocType = 'table' | 'image' | 'text' | 'pdf' | 'word' | 'excel' | 'markdown' | 'unknown'

/**
 * 获取文档类型
 * @param docType chunk 的 doc_type 字段
 * @param docName 文档名称
 * @returns 标准化的文档类型
 */
export function getDocType(docType?: string, docName?: string): DocType {
  if (docType === 'table') return 'table'
  if (docType === 'image') return 'image'
  
  if (docName) {
    const ext = docName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return 'pdf'
      case 'doc':
      case 'docx':
        return 'word'
      case 'xls':
      case 'xlsx':
        return 'excel'
      case 'md':
      case 'mdx':
        return 'markdown'
    }
  }
  
  return docType === 'text' ? 'text' : 'unknown'
}

/**
 * 获取文档类型的中文标签
 * @param docType 文档类型
 * @returns 中文标签
 */
export function getDocTypeLabel(docType: DocType | string | undefined): string {
  switch (docType) {
    case 'table':
      return '表格'
    case 'image':
      return '图片'
    case 'pdf':
      return 'PDF'
    case 'word':
      return 'Word'
    case 'excel':
      return 'Excel'
    case 'markdown':
      return 'Markdown'
    case 'text':
      return '文本'
    default:
      return '文本'
  }
}

/**
 * 截取内容摘要，移除 HTML 标签
 * @param content 原始内容
 * @param maxLength 最大长度
 * @returns 截取后的纯文本
 */
export function truncateContent(content: string, maxLength = 100): string {
  if (!content) return ''
  // 移除 HTML 标签并合并空白
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (textContent.length <= maxLength) return textContent
  return textContent.slice(0, maxLength) + '...'
}

/**
 * 按文档分组 chunks
 * @param chunks 引用 chunks 数组
 * @param docAggs 文档聚合数据（可选）
 * @returns 按文档 ID 分组的 Map
 */
export interface GroupedChunk {
  chunk: ReferenceChunk
  index: number
}

export interface DocumentGroup {
  docName: string
  docId: string
  chunks: GroupedChunk[]
  count?: number
}

export function groupChunksByDocument(
  chunks: ReferenceChunk[],
  docAggs?: DocAgg[]
): Map<string, DocumentGroup> {
  const groups = new Map<string, DocumentGroup>()
  
  // 先按 chunks 分组
  chunks.forEach((chunk, index) => {
    const docId = chunk.document_id || 'unknown'
    const existing = groups.get(docId)
    
    if (existing) {
      existing.chunks.push({ chunk, index })
    } else {
      groups.set(docId, {
        docName: chunk.document_name || '未知文档',
        docId,
        chunks: [{ chunk, index }]
      })
    }
  })
  
  // 如果有 docAggs，更新 count 信息
  if (docAggs) {
    docAggs.forEach(agg => {
      const group = groups.get(agg.doc_id)
      if (group) {
        group.count = agg.count
      }
    })
  }
  
  return groups
}

/**
 * API 响应数据类型（用于 extractDocAggsFromResponse）
 */
interface ApiResponseData {
  reference?: {
    doc_aggs?: DocAgg[]
  }
  doc_aggs?: DocAgg[]
}

/**
 * 从 API 响应中提取 doc_aggs
 * @param data API 响应数据
 * @returns doc_aggs 数组
 */
export function extractDocAggsFromResponse(data: unknown): DocAgg[] {
  if (!data || typeof data !== 'object') return []
  
  const typedData = data as ApiResponseData
  
  // 检查 reference.doc_aggs
  if (typedData.reference && Array.isArray(typedData.reference.doc_aggs)) {
    return typedData.reference.doc_aggs
  }
  
  // 检查顶层 doc_aggs
  if (Array.isArray(typedData.doc_aggs)) {
    return typedData.doc_aggs
  }
  
  return []
}

/**
 * 判断内容是否包含 HTML 结构
 * @param content 内容字符串
 * @returns 是否包含 HTML
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false
  return /<[a-z][\s\S]*>/i.test(content)
}

/**
 * 获取纯文本内容
 * @param content 可能包含 HTML 的内容
 * @returns 纯文本
 */
export function getPlainTextContent(content: string): string {
  if (!content) return ''
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
