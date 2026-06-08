import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ConversationHistoryMessage {
  id?: string
  role?: string
  content?: string
  reference?: {
    chunks?: ReferenceChunk[]
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export const extractReferencesFromSSEData = (
  data: unknown,
): ReferenceChunk[] => {
  if (!isRecord(data) || !isRecord(data.reference)) return []
  const chunks = data.reference.chunks
  return Array.isArray(chunks) ? (chunks as ReferenceChunk[]) : []
}

export const getReferenceDocId = (chunk: ReferenceChunk): unknown => {
  return isRecord(chunk) ? chunk.doc_id : undefined
}
