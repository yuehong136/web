import type { MetadataCondition } from '@/types/api'
import type {
  MetadataFilterMode,
  MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'

export interface RetrievalResult {
  chunk_id: string
  text: string
  doc_id: string
  docnm_kwd: string
  kb_id: string
  similarity: number
  vector_similarity: number
  term_similarity: number
  highlight?: string
  positions?: number[][]
}

export interface SearchMode {
  type: 'sparse' | 'dense' | 'hybrid' | 'fusion'
  weight_dense?: number
  weight_sparse?: number
  weights?: string
}

export interface RetrievalDocAgg {
  doc_name: string
  doc_id: string
  count: number
}

export interface RetrievalResultView {
  id: string
  text: string
  highlight?: string
  doc: { id: string; name: string; extension: string }
  scores: {
    combined: number
    vector: number
    term: number
  }
}

export interface SearchParams {
  similarity_threshold: number
  vector_similarity_weight: number
  use_kg: boolean
  top_k: number
  rerank_id: string | null
  highlight: boolean
  keyword: boolean
}

export interface RetrievalMetaDataFilter {
  method: 'auto' | 'semi_auto' | 'manual'
  logic?: 'and' | 'or'
  semi_auto?: Array<string | { key: string; op?: string }>
  manual?: Array<{ key: string; op: string; value: string }>
}

export interface MetadataState {
  mode: MetadataFilterMode
  condition: MetadataCondition
  semiAutoFields: MetadataSemiAutoField[]
}

export interface RawLLMModel {
  id?: string
  name?: string
  llm_name?: string
  type?: string
  mdl_type?: string
  available?: boolean
  status?: string
  max_tokens?: number
}

export interface RawLLMProviderPayload {
  llm?: RawLLMModel[]
}
