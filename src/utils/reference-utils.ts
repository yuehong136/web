/**
 * 引用分组工具函数
 * 用于检测和分组连续出现的引用标记，支持图片轮播功能
 */

import type { ReferenceChunk } from './reference-replacer'

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
  return `${baseUrl}/document/image/${imageId}`
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
