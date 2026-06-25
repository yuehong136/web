import type { OutputMap } from '../components/output'

export const retrievalMetaDataMethod = {
  Manual: 'manual',
  SemiAuto: 'semi_auto',
} as const

export const retrievalMetaDataLogic = {
  And: 'and',
  Or: 'or',
} as const

export const retrievalMetaDataOperatorOptions = [
  'eq',
  'ne',
  'in',
  'contains',
  'gt',
  'gte',
  'lt',
  'lte',
] as const

export const retrievalOutputs: OutputMap = {
  formalized_content: {
    value: '',
    type: 'string',
  },
  json: {
    value: [],
    type: 'Array<Object>',
  },
}

export type RetrievalMetadataManualItem = {
  key: string
  op: string
  value: string
}

export type RetrievalMetadataFilter = {
  method: string
  logic: string
  manual: RetrievalMetadataManualItem[]
  semi_auto: string[]
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    )
  }

  return []
}

function normalizeMetadataManualItem(
  value: unknown,
): RetrievalMetadataManualItem {
  const item = (
    value && typeof value === 'object' ? value : {}
  ) as Partial<RetrievalMetadataManualItem>

  return {
    key: typeof item.key === 'string' ? item.key : '',
    op:
      typeof item.op === 'string'
        ? item.op
        : retrievalMetaDataOperatorOptions[0],
    value: typeof item.value === 'string' ? item.value : '',
  }
}

export function normalizeMetadataFilter(
  value: unknown,
): RetrievalMetadataFilter {
  const filter = (
    value && typeof value === 'object' ? value : {}
  ) as Partial<RetrievalMetadataFilter>
  const method =
    typeof filter.method === 'string'
      ? filter.method
      : retrievalMetaDataMethod.Manual
  const logic =
    typeof filter.logic === 'string' ? filter.logic : retrievalMetaDataLogic.And

  return {
    method:
      method === retrievalMetaDataMethod.SemiAuto
        ? retrievalMetaDataMethod.SemiAuto
        : retrievalMetaDataMethod.Manual,
    logic:
      logic === retrievalMetaDataLogic.Or
        ? retrievalMetaDataLogic.Or
        : retrievalMetaDataLogic.And,
    manual: Array.isArray(filter.manual)
      ? filter.manual.map(normalizeMetadataManualItem)
      : [],
    semi_auto: normalizeStringArray(filter.semi_auto),
  }
}

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const nextValue = Number(value)
    if (Number.isFinite(nextValue)) {
      return nextValue
    }
  }

  return fallback
}

export function normalizeRetrievalFormForStore(
  form: Record<string, unknown> = {},
) {
  const datasetIds = normalizeStringArray(form.dataset_ids ?? form.kb_ids)

  return {
    ...form,
    query: typeof form.query === 'string' ? form.query : '{sys.query}',
    top_n: normalizeNumber(form.top_n, 8),
    top_k: normalizeNumber(form.top_k, 1024),
    similarity_threshold: normalizeNumber(form.similarity_threshold, 0.2),
    keywords_similarity_weight: normalizeNumber(
      form.keywords_similarity_weight,
      0.3,
    ),
    dataset_ids: datasetIds,
    kb_ids: datasetIds,
    memory_ids: normalizeStringArray(form.memory_ids),
    user_id: typeof form.user_id === 'string' ? form.user_id : '',
    rerank_id: typeof form.rerank_id === 'string' ? form.rerank_id : '',
    empty_response:
      typeof form.empty_response === 'string' ? form.empty_response : '',
    retrieval_from: form.retrieval_from === 'memory' ? 'memory' : 'dataset',
    cross_languages: normalizeStringArray(form.cross_languages),
    use_kg: Boolean(form.use_kg),
    toc_enhance: Boolean(form.toc_enhance),
    meta_data_filter: normalizeMetadataFilter(form.meta_data_filter),
    outputs: retrievalOutputs,
  }
}

export function serializeRetrievalFormForDsl(
  form: Record<string, unknown> = {},
) {
  return {
    ...normalizeRetrievalFormForStore(form),
    outputs: retrievalOutputs,
  }
}
