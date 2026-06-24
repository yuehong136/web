export enum PipelineResultChunkType {
  All = 'all',
  Text = 'text',
  Table = 'table',
  Image = 'image',
  Other = 'other',
}

export enum PipelineResultView {
  Chunks = 'chunks',
  Json = 'json',
}

export type PipelineOutputChunk = Record<string, unknown>

export interface PipelineResultSummary {
  totalChunks: number
  textChunks: number
  tableChunks: number
  imageChunks: number
  otherChunks: number
  vectorizedChunks: number
  totalTextCharacters: number
}

export interface ChunkMetadataEntry {
  key: string
  value: unknown
}

const vectorFieldPattern = /^q_\d+_vec$/
const hiddenMetadataFields = new Set([
  'content_ltks',
  'content_sm_ltks',
  'content_with_weight',
  'doc_type_kwd',
  'q_1024_vec',
  'q_1536_vec',
  'q_2048_vec',
  'summary',
  'text',
  'title_sm_tks',
  'title_tks',
])

function isRecord(value: unknown): value is PipelineOutputChunk {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

function normalizeType(value: string): PipelineResultChunkType {
  const normalized = value.trim().toLowerCase()
  if (normalized === PipelineResultChunkType.Text) {
    return PipelineResultChunkType.Text
  }
  if (normalized === PipelineResultChunkType.Table) {
    return PipelineResultChunkType.Table
  }
  if (normalized === PipelineResultChunkType.Image) {
    return PipelineResultChunkType.Image
  }
  return PipelineResultChunkType.Other
}

export function isVectorField(fieldName: string): boolean {
  return vectorFieldPattern.test(fieldName)
}

export function normalizePipelineOutputChunks(
  output: unknown,
): PipelineOutputChunk[] {
  if (Array.isArray(output)) {
    return output.filter(isRecord)
  }

  if (!isRecord(output)) {
    return []
  }

  for (const fieldName of ['chunks', 'data', 'items', 'result', 'output']) {
    const value = output[fieldName]
    if (Array.isArray(value)) {
      return value.filter(isRecord)
    }
  }

  return []
}

export function getChunkText(chunk: PipelineOutputChunk): string {
  for (const fieldName of [
    'text',
    'content_with_weight',
    'content',
    'summary',
  ]) {
    const value = chunk[fieldName]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return ''
}

export function getChunkTitle(chunk: PipelineOutputChunk): string {
  for (const fieldName of ['title_tks', 'title_sm_tks', 'title', 'section']) {
    const value = chunk[fieldName]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return ''
}

export function getChunkType(
  chunk: PipelineOutputChunk,
): PipelineResultChunkType {
  const explicitType = toStringValue(chunk.doc_type_kwd || chunk.type)
  if (explicitType) {
    return normalizeType(explicitType)
  }
  if (chunk.image || chunk.img_id) {
    return PipelineResultChunkType.Image
  }
  if (chunk.table || chunk.table_html) {
    return PipelineResultChunkType.Table
  }
  if (getChunkText(chunk)) {
    return PipelineResultChunkType.Text
  }
  return PipelineResultChunkType.Other
}

export function getChunkOrder(
  chunk: PipelineOutputChunk,
  fallbackIndex: number,
): number {
  const value = chunk.chunk_order_int
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  return fallbackIndex + 1
}

export function getChunkVectorFields(chunk: PipelineOutputChunk): string[] {
  return Object.keys(chunk).filter(isVectorField)
}

export function getChunkVectorDimensions(
  chunk: PipelineOutputChunk,
): number | null {
  for (const fieldName of getChunkVectorFields(chunk)) {
    const value = chunk[fieldName]
    if (Array.isArray(value)) {
      return value.length
    }
  }
  return null
}

export function getChunkPages(chunk: PipelineOutputChunk): number[] {
  const pages = chunk.page_num_int
  if (Array.isArray(pages)) {
    return [...new Set(pages.map(Number).filter(Number.isFinite))]
  }
  if (typeof pages === 'number' && Number.isFinite(pages)) {
    return [pages]
  }

  const positions = chunk.position_int
  if (Array.isArray(positions)) {
    const extractedPages = positions
      .map((position) => (Array.isArray(position) ? Number(position[0]) : NaN))
      .filter(Number.isFinite)
    return [...new Set(extractedPages)]
  }

  return []
}

export function getChunkMetadataEntries(
  chunk: PipelineOutputChunk,
): ChunkMetadataEntry[] {
  return Object.entries(chunk)
    .filter(([key]) => !hiddenMetadataFields.has(key) && !isVectorField(key))
    .map(([key, value]) => ({ key, value }))
}

export function buildPipelineResultSummary(
  chunks: PipelineOutputChunk[],
): PipelineResultSummary {
  return chunks.reduce<PipelineResultSummary>(
    (summary, chunk) => {
      const chunkType = getChunkType(chunk)
      summary.totalChunks += 1
      summary.totalTextCharacters += getChunkText(chunk).length

      if (chunkType === PipelineResultChunkType.Text) {
        summary.textChunks += 1
      } else if (chunkType === PipelineResultChunkType.Table) {
        summary.tableChunks += 1
      } else if (chunkType === PipelineResultChunkType.Image) {
        summary.imageChunks += 1
      } else {
        summary.otherChunks += 1
      }

      if (getChunkVectorFields(chunk).length > 0) {
        summary.vectorizedChunks += 1
      }

      return summary
    },
    {
      totalChunks: 0,
      textChunks: 0,
      tableChunks: 0,
      imageChunks: 0,
      otherChunks: 0,
      vectorizedChunks: 0,
      totalTextCharacters: 0,
    },
  )
}

export function filterPipelineChunks(
  chunks: PipelineOutputChunk[],
  query: string,
  type: PipelineResultChunkType,
): PipelineOutputChunk[] {
  const normalizedQuery = query.trim().toLowerCase()

  return chunks.filter((chunk, index) => {
    const chunkType = getChunkType(chunk)
    if (type !== PipelineResultChunkType.All && chunkType !== type) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const searchableText = [
      getChunkText(chunk),
      getChunkTitle(chunk),
      getChunkOrder(chunk, index),
      chunk.img_id,
      chunk.id,
      chunk.chunk_id,
      chunk.doc_type_kwd,
    ]
      .map(toStringValue)
      .join(' ')
      .toLowerCase()

    return searchableText.includes(normalizedQuery)
  })
}

export function createDisplayJson(value: unknown): unknown {
  return sanitizeDisplayValue(value, 0)
}

function sanitizeDisplayValue(value: unknown, depth: number): unknown {
  if (depth > 8) {
    return '[depth limit]'
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDisplayValue(item, depth + 1))
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => {
      if (isVectorField(key) && Array.isArray(fieldValue)) {
        return [key, `[vector omitted: ${fieldValue.length} dimensions]`]
      }
      return [key, sanitizeDisplayValue(fieldValue, depth + 1)]
    }),
  )
}
