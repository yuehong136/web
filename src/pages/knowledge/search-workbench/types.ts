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
