import type { CSSProperties } from 'react'
import type { Document } from '@/types/api'

export type CSSVarStyle = CSSProperties & Record<`--${string}`, string>

export type TextMode = 'full' | 'ellipse'

export type ChunkFilterStatus = 'all' | 'enabled' | 'disabled'

export interface ChunkData {
  chunk_id: string
  content_with_weight: string
  doc_id: string
  docnm_kwd: string
  important_kwd: string[]
  question_kwd: string[]
  img_id: string
  available_int: number
  positions: number[][]
  doc_type_kwd?: string
}

export type ChunkListDocument = Document & {
  thumbnail?: string
  auth?: unknown
}

export interface MetadataEntry {
  id: string
  key: string
  value: unknown
}
