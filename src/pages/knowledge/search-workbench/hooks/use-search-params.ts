import React from 'react'
import { useTranslation } from 'react-i18next'

import type { MetadataCondition } from '@/types/api'
import type {
  MetadataFilterMode,
  MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'

import { createActiveMetaDataFilter } from '../adapters/metadata-filter'
export { createActiveMetaDataFilter } from '../adapters/metadata-filter'

import { DEFAULT_SEARCH_MODE, DEFAULT_SEARCH_PARAMS } from '../constants'
import type {
  RetrievalMetaDataFilter,
  SearchMode,
  SearchParams,
} from '../types'

export interface UseSearchParamsResult {
  searchParams: SearchParams
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams>>
  searchMode: SearchMode
  setSearchMode: React.Dispatch<React.SetStateAction<SearchMode>>
  selectedLanguages: string[]
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>
  metadataMode: MetadataFilterMode
  setMetadataMode: React.Dispatch<React.SetStateAction<MetadataFilterMode>>
  metadataCondition: MetadataCondition
  setMetadataCondition: React.Dispatch<React.SetStateAction<MetadataCondition>>
  metadataSemiAutoFields: MetadataSemiAutoField[]
  setMetadataSemiAutoFields: React.Dispatch<
    React.SetStateAction<MetadataSemiAutoField[]>
  >
  activeMetaDataFilter: RetrievalMetaDataFilter | undefined
  activeConfigBadges: string[]
}

export const useSearchParamsState = (): UseSearchParamsResult => {
  const { t } = useTranslation()

  const [searchParams, setSearchParams] = React.useState<SearchParams>(() => ({
    ...DEFAULT_SEARCH_PARAMS,
  }))
  const [searchMode, setSearchMode] = React.useState<SearchMode>(() => ({
    ...DEFAULT_SEARCH_MODE,
  }))
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([])
  const [metadataMode, setMetadataMode] =
    React.useState<MetadataFilterMode>('disabled')
  const [metadataCondition, setMetadataCondition] =
    React.useState<MetadataCondition>({
      logic: 'and',
      conditions: [],
    })
  const [metadataSemiAutoFields, setMetadataSemiAutoFields] = React.useState<
    MetadataSemiAutoField[]
  >([])

  const activeMetaDataFilter = React.useMemo<
    RetrievalMetaDataFilter | undefined
  >(
    () =>
      createActiveMetaDataFilter({
        metadataMode,
        metadataCondition,
        metadataSemiAutoFields,
      }),
    [metadataCondition, metadataMode, metadataSemiAutoFields],
  )

  const activeConfigBadges = React.useMemo(() => {
    const badges = [
      t('knowledge.search.badges.threshold', {
        value: searchParams.similarity_threshold.toFixed(2),
      }),
      t('knowledge.search.badges.vectorWeight', {
        value: searchParams.vector_similarity_weight.toFixed(2),
      }),
      t('knowledge.search.badges.topK', { value: searchParams.top_k }),
    ]

    if (searchParams.rerank_id) badges.push('Rerank')
    if (searchParams.use_kg)
      badges.push(t('knowledge.search.badges.knowledgeGraph'))
    if (searchParams.keyword) badges.push(t('knowledge.search.badges.keyword'))
    if (selectedLanguages.length > 0) {
      badges.push(
        t('knowledge.search.badges.crossLanguages', {
          count: selectedLanguages.length,
        }),
      )
    }
    if (activeMetaDataFilter?.method === 'auto')
      badges.push(t('knowledge.search.badges.metadataAuto'))
    if (activeMetaDataFilter?.method === 'semi_auto') {
      badges.push(
        t('knowledge.search.badges.metadataSemiAuto', {
          count: activeMetaDataFilter.semi_auto?.length || 0,
        }),
      )
    }
    if (activeMetaDataFilter?.method === 'manual') {
      badges.push(
        t('knowledge.search.badges.metadataManual', {
          count: activeMetaDataFilter.manual?.length || 0,
        }),
      )
    }

    return badges
  }, [activeMetaDataFilter, searchParams, selectedLanguages.length, t])

  return {
    searchParams,
    setSearchParams,
    searchMode,
    setSearchMode,
    selectedLanguages,
    setSelectedLanguages,
    metadataMode,
    setMetadataMode,
    metadataCondition,
    setMetadataCondition,
    metadataSemiAutoFields,
    setMetadataSemiAutoFields,
    activeMetaDataFilter,
    activeConfigBadges,
  }
}
