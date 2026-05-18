import type { SelectOptionGroup } from '@/components/ui/multi-select-with-search'

import type { SearchMode, SearchParams } from './types'

export const CROSS_LANGUAGE_OPTIONS: SelectOptionGroup[] = [
  'English',
  'Chinese',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Vietnamese',
  'Arabic',
  'Turkish',
].map((language) => ({ label: language, value: language }))

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const DEFAULT_SEARCH_PARAMS: SearchParams = {
  similarity_threshold: 0.2,
  vector_similarity_weight: 0.3,
  use_kg: false,
  top_k: 1024,
  rerank_id: null,
  highlight: true,
  keyword: false,
}

export const DEFAULT_PAGE_SIZE = 20

export const DEFAULT_SEARCH_MODE: SearchMode = {
  type: 'fusion',
  weights: '0.05,0.95',
}

export const FUSION_DEFAULT_WEIGHTS = '0.05,0.95'

export const HYBRID_DEFAULT_WEIGHT_DENSE = 0.7
export const HYBRID_DEFAULT_WEIGHT_SPARSE = 0.3

export const SEARCH_MODE_VALUES = [
  'fusion',
  'sparse',
  'hybrid',
  'dense',
] as const

export type SearchModeValue = (typeof SEARCH_MODE_VALUES)[number]

export const DISABLED_SEARCH_MODES: ReadonlySet<SearchModeValue> = new Set([
  'dense',
])
