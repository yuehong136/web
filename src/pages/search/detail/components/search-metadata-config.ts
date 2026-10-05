import type { SearchConfig } from '@/types/search'
import type { MetadataCondition } from '@/types/api'
import type {
  MetadataFilterMode,
  MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'
export const getMetadataMode = (
  metaDataFilter?: SearchConfig['meta_data_filter'],
): MetadataFilterMode => {
  if (
    metaDataFilter?.method === 'auto' ||
    metaDataFilter?.method === 'semi_auto' ||
    metaDataFilter?.method === 'manual'
  ) {
    return metaDataFilter.method
  }
  return 'disabled'
}

export const toMetadataCondition = (
  metaDataFilter?: SearchConfig['meta_data_filter'],
): MetadataCondition => {
  return {
    logic: metaDataFilter?.logic || 'and',
    conditions: (metaDataFilter?.manual || []).map((item) => ({
      name: item.key || '',
      comparison_operator: item.op || 'is',
      value: item.value || '',
    })),
  }
}

export const toMetadataSemiAutoFields = (
  metaDataFilter?: SearchConfig['meta_data_filter'],
): MetadataSemiAutoField[] => {
  return (metaDataFilter?.semi_auto || [])
    .map((item) => {
      if (typeof item === 'string') return { key: item }
      return { key: item.key, op: item.op }
    })
    .filter((item) => Boolean(item.key))
}
