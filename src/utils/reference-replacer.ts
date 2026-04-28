/**
 * 引用标识替换工具
 * 用于将流式输出中的[ID:x]格式替换为引用标志
 */

export interface ReferenceInfo {
  id: string
  content: string
  document_name?: string
  document_id?: string
  dataset_id?: string
  url?: string
  similarity?: number
}

export interface ReferenceChunk {
  id: string
  content: string
  document_id: string
  document_name: string
  dataset_id: string
  image_id?: string
  positions?: number[][]
  url?: string | null
  similarity?: number
  vector_similarity?: number
  term_similarity?: number
  doc_type?: string
  reference_index?: number
  reference_key?: string
}

/**
 * 解析引用数据，构建ID到引用信息的映射
 */
export function parseReferences(chunks: ReferenceChunk[]): Map<string, ReferenceInfo> {
  const referenceMap = new Map<string, ReferenceInfo>()
  
  chunks.forEach((chunk, index) => {
    referenceMap.set(index.toString(), {
      id: chunk.id,
      content: chunk.content,
      document_name: chunk.document_name,
      document_id: chunk.document_id,
      dataset_id: chunk.dataset_id,
      url: chunk.url || undefined,
      similarity: chunk.similarity
    })
  })
  
  return referenceMap
}

/**
 * 替换文本中的[ID:x]格式为HTML引用标志
 */
export function replaceReferenceIds(
  text: string, 
  referenceMap: Map<string, ReferenceInfo>
): string {
  // 匹配 [ID:数字] 格式
  const referencePattern = /\[ID:(\d+)\]/g
  
  return text.replace(referencePattern, (match, id) => {
    const reference = referenceMap.get(id)
    if (!reference) {
      // 如果找不到对应的引用，保持原样
      return match
    }
    
    // 返回HTML格式的引用标志
    return `<sup class="reference-marker" data-reference-id="${id}" data-document-name="${reference.document_name || ''}" data-similarity="${reference.similarity || ''}" title="引用: ${reference.document_name || '未知文档'}">[${parseInt(id) + 1}]</sup>`
  })
}

/**
 * 替换文本中的普通[数字]格式为HTML引用标志（兼容旧格式）
 */
export function replaceLegacyReferenceIds(
  text: string,
  referenceMap: Map<string, ReferenceInfo>
): string {
  // 匹配独立的 [数字] 格式，但排除已经是引用标志的情况
  const legacyReferencePattern = /(?<!ID:)\[(\d+)\](?!\()/g
  
  return text.replace(legacyReferencePattern, (match, id) => {
    const reference = referenceMap.get(id)
    if (!reference) {
      // 如果找不到对应的引用，保持原样
      return match
    }
    
    // 返回HTML格式的引用标志
    return `<sup class="reference-marker" data-reference-id="${id}" data-document-name="${reference.document_name || ''}" data-similarity="${reference.similarity || ''}" title="引用: ${reference.document_name || '未知文档'}">[${parseInt(id) + 1}]</sup>`
  })
}

/**
 * 综合处理引用替换（同时处理[ID:x]和[x]格式）
 */
export function processReferences(
  text: string,
  chunks: ReferenceChunk[] = []
): string {
  if (!chunks.length) {
    return text
  }
  
  const referenceMap = parseReferences(chunks)
  
  // 先处理 [ID:x] 格式
  let processedText = replaceReferenceIds(text, referenceMap)
  
  // 再处理普通 [x] 格式（兼容）
  processedText = replaceLegacyReferenceIds(processedText, referenceMap)
  
  return processedText
}

/**
 * 从SSE响应数据中提取引用chunks
 */
export function extractReferencesFromSSEData(data: any): ReferenceChunk[] {
  if (!data || typeof data !== 'object') {
    return []
  }
  
  // 检查新格式：data.reference.chunks
  if (data.reference && Array.isArray(data.reference.chunks)) {
    return data.reference.chunks
  }

  if (
    data.reference &&
    data.reference.chunks &&
    typeof data.reference.chunks === 'object'
  ) {
    return Object.entries(data.reference.chunks)
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([key, chunk]) => ({
        ...(chunk as ReferenceChunk),
        reference_index: Number.isFinite(Number(key)) ? Number(key) : undefined,
        reference_key: key,
      }))
  }
  
  // 检查旧格式：data.chunks
  if (Array.isArray(data.chunks)) {
    return data.chunks
  }

  if (data.chunks && typeof data.chunks === 'object') {
    return Object.entries(data.chunks)
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([key, chunk]) => ({
        ...(chunk as ReferenceChunk),
        reference_index: Number.isFinite(Number(key)) ? Number(key) : undefined,
        reference_key: key,
      }))
  }
  
  return []
}

/**
 * 判断图片类型文档
 * 支持 'image' 和 'table' 类型（与 RAGFlow 保持一致）
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
