export enum SearchExecutionPhase {
  IDLE = 'idle',
  RETRIEVING = 'retrieving',
  SUMMARIZING = 'summarizing',
  RELATED = 'related',
  COMPLETE = 'complete',
  ERROR = 'error',
  STOPPED = 'stopped',
}

export interface LLMSetting {
  temperature?: number
  top_p?: number
  presence_penalty?: number
  frequency_penalty?: number
  max_tokens?: number
}

export interface SearchConfig {
  kb_ids: string[]
  similarity_threshold: number
  vector_similarity_weight: number
  top_k: number
  summary: boolean
  chat_id?: string
  llm_setting?: LLMSetting
  related_search: boolean
  use_rerank: boolean
  rerank_id?: string
  use_kg: boolean
  web_search?: boolean
  query_mindmap?: boolean
  meta_data_filter?: {
    method: string
    manual: Array<{ key: string; op: string; value: string }>
  }
}

export interface SearchApp {
  id: string
  name: string
  description?: string
  avatar?: string | null
  search_config: SearchConfig
  tenant_id: string
  create_time: number
  update_time: number
}

export interface SearchAppListItem {
  id: string
  name: string
  description?: string
  avatar?: string | null
  kb_ids: string[]
  summary?: boolean
  related_search?: boolean
  create_time: number
  update_time: number
}

export interface ChunkResult {
  chunk_id: string
  text: string
  content_with_weight?: string
  doc_id: string
  docnm_kwd: string
  kb_id: string
  similarity: number
  vector_similarity: number
  term_similarity: number
  highlight?: string
  positions?: number[][]
  img_id?: string
}

export interface DocAgg {
  doc_name: string
  doc_id: string
  count: number
}

export interface SearchTurn {
  id: string
  query: string
  summary: string
  isStreaming: boolean
  chunks: ChunkResult[]
  docAggs: DocAgg[]
  relatedQuestions: string[]
  total: number
  phase: SearchExecutionPhase
  errorMessage?: string
}
