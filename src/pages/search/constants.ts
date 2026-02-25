export enum SearchStatus {
  IDLE = 'idle',
  SEARCHING = 'searching',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export const DEFAULT_SEARCH_CONFIG = {
  similarity_threshold: 0.2,
  vector_similarity_weight: 0.3,
  top_k: 8,
  summary: false,
  related_search: false,
  use_rerank: false,
  use_kg: false,
} as const
