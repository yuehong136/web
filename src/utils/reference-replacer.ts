/**
 * 引用标识替换工具
 * 用于将流式输出中的[ID:x]格式替换为引用标志
 */

export interface ReferenceInfo {
  id: string | number
  content: string
  document_name?: string
  document_id?: string
  dataset_id?: string
  url?: string
  similarity?: number
}

export interface ReferenceChunk {
  document_metadata?: Record<string, unknown>
  id: string | number
  content: string
  document_id?: string
  document_name?: string
  dataset_id?: string
  image_id?: string
  positions?: number[][]
  url?: string | null
  similarity?: number
  vector_similarity?: number
  term_similarity?: number
  doc_type?: string
  doc_type_kwd?: string
  citation_id?: string
  reference_index?: number
  reference_key?: string
}

/**
 * 解析引用数据，构建ID到引用信息的映射
 */
export function parseReferences(
  chunks: ReferenceChunk[],
): Map<string, ReferenceInfo> {
  const referenceMap = new Map<string, ReferenceInfo>()

  const hasExplicitKeys = chunks.some(
    (chunk) =>
      chunk.reference_key !== undefined || chunk.reference_index !== undefined,
  )
  chunks.forEach((chunk, index) => {
    const key = chunk.reference_key ?? chunk.reference_index?.toString()
    if (hasExplicitKeys && key === undefined) return
    referenceMap.set(key ?? index.toString(), {
      id: chunk.id,
      content: chunk.content,
      document_name: chunk.document_name,
      document_id: chunk.document_id,
      dataset_id: chunk.dataset_id,
      url: chunk.url || undefined,
      similarity: chunk.similarity,
    })
  })

  return referenceMap
}

/**
 * 替换文本中的[ID:x]格式为HTML引用标志
 */
export function replaceReferenceIds(
  text: string,
  referenceMap: Map<string, ReferenceInfo>,
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
  referenceMap: Map<string, ReferenceInfo>,
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
  chunks: ReferenceChunk[] = [],
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readString = (value: unknown): string =>
  typeof value === 'string' ? value : ''

/** Preserve explicit citation identity after the server removes invalid rows. */
const normalizeReferenceChunk = (
  value: unknown,
  mapKey?: string,
): ReferenceChunk | undefined => {
  if (!isRecord(value)) return undefined
  const citationKey =
    typeof value.citation_id === 'string' ? value.citation_id : mapKey
  const chunk: ReferenceChunk = {
    ...value,
    id:
      typeof value.id === 'string' || typeof value.id === 'number'
        ? value.id
        : '',
    content: readString(value.content),
  }
  for (const field of ['document_id', 'document_name', 'dataset_id'] as const) {
    if (Object.hasOwn(value, field)) chunk[field] = readString(value[field])
  }
  if (citationKey !== undefined) {
    const index = /^\d+$/.test(citationKey) ? Number(citationKey) : NaN
    chunk.reference_key = citationKey
    chunk.reference_index = Number.isSafeInteger(index) ? index : undefined
  }
  return chunk
}

/** Extract canonical reference arrays/maps from stream frames or history. */
export function extractReferencesFromSSEData(input: unknown): ReferenceChunk[] {
  if (!isRecord(input)) return []
  const chunks = isRecord(input.reference)
    ? input.reference.chunks
    : input.chunks
  if (Array.isArray(chunks)) {
    const hasInvalidRows = chunks.some((chunk) => !isRecord(chunk))
    return chunks.flatMap((chunk, index) => {
      const normalized = normalizeReferenceChunk(
        chunk,
        hasInvalidRows ? String(index) : undefined,
      )
      return normalized ? [normalized] : []
    })
  }
  if (!isRecord(chunks)) return []
  return Object.entries(chunks)
    .sort(([left], [right]) => Number(left) - Number(right))
    .flatMap(([key, chunk]) => {
      const normalized = normalizeReferenceChunk(chunk, key)
      return normalized ? [normalized] : []
    })
}
