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
  // 存储未计算的分项后端给 null；适配层统一用 readRetrievalScore 判定，不直接读数
  similarity?: number | null
  vector_similarity?: number | null
  term_similarity?: number | null
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
  /** 有效评分在 [0, 1] 内，0 是真实评分；null 是缺失或无效（含超出范围），显示“不可用”，不按 0 计 */
  scores: {
    combined: number | null
    vector: number | null
    term: number | null
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

export interface SearchRequestScope {
  question: string
  docIds: string[]
  metadata?: RetrievalMetaDataFilter
  similarityThreshold: number
}

export interface MetadataState {
  mode: MetadataFilterMode
  condition: MetadataCondition
  semiAutoFields: MetadataSemiAutoField[]
}

export interface SearchConfigState {
  searchParams: SearchParams
  searchMode: SearchMode
  pageSize: number
  selectedLanguages: string[]
  metadataMode: MetadataFilterMode
  metadataCondition: MetadataCondition
  metadataSemiAutoFields: MetadataSemiAutoField[]
  activeMetaDataFilter?: RetrievalMetaDataFilter
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
