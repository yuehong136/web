import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useFetchDocumentFilter,
  useFetchDocumentList,
} from '@/hooks/use-document-request'
import type { DocumentFilter } from '@/types/api'
import type { DocumentListState, FilterValue, SortConfig } from '../types'
import {
  DEFAULT_PAGE_SIZE,
  EMPTY_METADATA_FIELD,
  SEARCH_DEBOUNCE_MS,
} from '../constants'
import {
  isSameFilterValue,
  sanitizeFilterValueByCollections,
  useFilterCollections,
} from './use-document-filters'

export function useDocumentListState(): DocumentListState {
  const { id: kbId } = useParams<{ id: string }>()
  const [searchKeywords, setSearchKeywords] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    orderby: 'create_time',
    desc: true,
  })
  const [filterValue, setFilterValue] = useState<FilterValue>({
    type: [],
    run: [],
    metadata: {},
  })
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const debouncedKeywords = useDebouncedValue(
    searchKeywords,
    SEARCH_DEBOUNCE_MS,
  )

  const documentFilter = useMemo((): DocumentFilter => {
    const typeValues = (filterValue.type as string[]) || []
    const rawRunValues = (filterValue.run as string[]) || []
    const metadataValues =
      (filterValue.metadata as Record<string, string[]>) || {}

    let returnEmptyMetadata = false
    const runValues = rawRunValues.filter((value) => {
      if (value === EMPTY_METADATA_FIELD) {
        returnEmptyMetadata = true
        return false
      }
      return true
    })

    return {
      suffix: typeValues.length > 0 ? typeValues : undefined,
      run_status: runValues.length > 0 ? runValues : undefined,
      metadata:
        Object.keys(metadataValues).length > 0 ? metadataValues : undefined,
      return_empty_metadata: returnEmptyMetadata || undefined,
    }
  }, [filterValue])

  const { documents, total, isLoading, isFetching, isError, refetch } =
    useFetchDocumentList({
      knowledgeBaseId: kbId,
      page,
      page_size: pageSize,
      keywords: debouncedKeywords,
      orderby: sortConfig.orderby,
      desc: sortConfig.desc,
      filter_params: documentFilter,
      enableSmartPolling: true,
    })

  const {
    filterOptions,
    isLoading: filterOptionsLoading,
    refetch: refreshFilterOptions,
  } = useFetchDocumentFilter(kbId)
  const filterCollections = useFilterCollections(filterOptions)

  useEffect(() => {
    if (!filterOptions) return

    setFilterValue((prev) => {
      const next = sanitizeFilterValueByCollections(prev, filterCollections)
      return isSameFilterValue(prev, next) ? prev : next
    })
  }, [filterOptions, filterCollections])

  const filterCount = useMemo(() => {
    return typeof filterValue === 'object' && filterValue !== null
      ? Object.values(filterValue).reduce((pre, cur) => {
          if (Array.isArray(cur)) {
            return pre + cur.length
          }
          if (typeof cur === 'object') {
            return (
              pre +
              Object.values(cur).reduce((innerPre, innerCur) => {
                return innerPre + (innerCur?.length || 0)
              }, 0)
            )
          }
          return pre
        }, 0)
      : 0
  }, [filterValue])

  const hasActiveFilters = filterCount > 0 || searchKeywords.trim() !== ''
  const allSelected =
    documents.length > 0 && selectedDocs.size === documents.length
  const selectedDocuments = useMemo(() => {
    return documents.filter((doc) => selectedDocs.has(doc.id))
  }, [documents, selectedDocs])

  const selectDoc = useCallback((docId: string, checked: boolean) => {
    setSelectedDocs((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(docId)
      } else {
        newSet.delete(docId)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedDocs(new Set(documents.map((doc) => doc.id)))
      } else {
        setSelectedDocs(new Set())
      }
    },
    [documents],
  )

  const clearSelection = useCallback(() => {
    setSelectedDocs(new Set())
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilterValue({
      type: [],
      run: [],
      metadata: {},
    })
    setSearchKeywords('')
    setPage(1)
  }, [])

  const handleSetFilterValue = useCallback((value: FilterValue) => {
    setFilterValue(value)
    setPage(1)
  }, [])

  const handleSetSearchKeywords = useCallback((keywords: string) => {
    setSearchKeywords(keywords)
    setPage(1)
  }, [])

  return {
    documents,
    total,
    isLoading,
    isFetching,
    isError,
    filterOptions,
    filterOptionsLoading,
    searchKeywords,
    debouncedKeywords,
    filterValue,
    sortConfig,
    selectedDocs,
    page,
    pageSize,
    filterCount,
    hasActiveFilters,
    allSelected,
    selectedDocuments,
    setSearchKeywords: handleSetSearchKeywords,
    setFilterValue: handleSetFilterValue,
    setSortConfig,
    setPage,
    setPageSize,
    selectDoc,
    selectAll,
    clearSelection,
    clearAllFilters,
    refreshFilterOptions,
    refetch,
  }
}
