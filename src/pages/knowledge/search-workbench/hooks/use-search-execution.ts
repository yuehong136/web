import React from 'react'

import { knowledgeAPI } from '@/api/knowledge'

import { toRetrievalResultViewList } from '../adapters/retrieval-result'
import { DEFAULT_PAGE_SIZE, FUSION_DEFAULT_WEIGHTS } from '../constants'
import type {
  RetrievalDocAgg,
  RetrievalMetaDataFilter,
  RetrievalResult,
  RetrievalResultView,
  SearchMode,
  SearchParams,
} from '../types'

interface UseSearchExecutionInput {
  kbId: string | undefined
  searchParams: SearchParams
  searchMode: SearchMode
  selectedLanguages: string[]
  activeMetaDataFilter: RetrievalMetaDataFilter | undefined
}

interface SearchOverride {
  page?: number
  pageSize?: number
  selectedDocIds?: string[]
}

export interface UseSearchExecutionResult {
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
  isSearching: boolean
  results: RetrievalResultView[]
  totalResults: number
  docAggs: RetrievalDocAgg[]
  selectedDocIds: string[]
  showDocFilter: boolean
  pageSize: number
  currentPage: number
  hasSearched: boolean
  totalPages: number
  pageNumbers: number[]
  runSearch: (override?: SearchOverride) => Promise<void>
  handleSearchSubmit: () => void
  handlePageChange: (page: number) => void
  handlePageSizeChange: (size: number) => void
  handleDocFilter: (docId: string, checked: boolean) => void
  handleClearDocFilter: () => void
  handleSelectAllDocs: () => void
  toggleDocFilter: () => void
}

export const useSearchExecution = ({
  kbId,
  searchParams,
  searchMode,
  selectedLanguages,
  activeMetaDataFilter,
}: UseSearchExecutionInput): UseSearchExecutionResult => {
  const [query, setQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [results, setResults] = React.useState<RetrievalResultView[]>([])
  const [totalResults, setTotalResults] = React.useState(0)
  const [docAggs, setDocAggs] = React.useState<RetrievalDocAgg[]>([])
  const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>([])
  const [showDocFilter, setShowDocFilter] = React.useState(false)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [hasSearched, setHasSearched] = React.useState(false)

  const requestIdRef = React.useRef(0)

  const latestArgsRef = React.useRef({
    query,
    searchParams,
    searchMode,
    selectedLanguages,
    activeMetaDataFilter,
    pageSize,
    selectedDocIds,
    currentPage,
  })

  latestArgsRef.current = {
    query,
    searchParams,
    searchMode,
    selectedLanguages,
    activeMetaDataFilter,
    pageSize,
    selectedDocIds,
    currentPage,
  }

  const runSearch = React.useCallback(
    async (override?: SearchOverride) => {
      if (!kbId) return
      const latest = latestArgsRef.current
      const trimmedQuery = latest.query.trim()
      if (!trimmedQuery) return

      const effectivePage = override?.page ?? latest.currentPage
      const effectivePageSize = override?.pageSize ?? latest.pageSize
      const effectiveDocIds = override?.selectedDocIds ?? latest.selectedDocIds

      const myRequestId = ++requestIdRef.current
      setIsSearching(true)

      const searchData = {
        kb_ids: [kbId],
        question: trimmedQuery,
        similarity_threshold: latest.searchParams.similarity_threshold,
        vector_similarity_weight: latest.searchParams.vector_similarity_weight,
        use_kg: latest.searchParams.use_kg,
        top_k: latest.searchParams.top_k,
        rerank_id: latest.searchParams.rerank_id,
        highlight: latest.searchParams.highlight,
        keyword: latest.searchParams.keyword,
        page: effectivePage,
        size: effectivePageSize,
        doc_ids: effectiveDocIds.length > 0 ? effectiveDocIds : null,
        cross_languages:
          latest.selectedLanguages.length > 0 ? latest.selectedLanguages : null,
        meta_data_filter: latest.activeMetaDataFilter,
        search_mode:
          latest.searchMode.type !== 'fusion'
            ? latest.searchMode
            : {
                type: 'fusion' as const,
                weights: latest.searchMode.weights || FUSION_DEFAULT_WEIGHTS,
              },
      }

      try {
        const response = await knowledgeAPI.retrievalTest.test(searchData)
        if (myRequestId !== requestIdRef.current) return
        setResults(
          toRetrievalResultViewList(response.chunks as RetrievalResult[]),
        )
        setTotalResults(response.total)
        setDocAggs(response.doc_aggs)
        setHasSearched(true)
      } catch (error) {
        if (myRequestId !== requestIdRef.current) return
        console.error('Knowledge search failed', error)
        setResults([])
        setTotalResults(0)
        setDocAggs([])
      } finally {
        if (myRequestId === requestIdRef.current) {
          setIsSearching(false)
        }
      }
    },
    [kbId],
  )

  const handleSearchSubmit = React.useCallback(() => {
    setCurrentPage(1)
    void runSearch({ page: 1 })
  }, [runSearch])

  const handlePageChange = React.useCallback(
    (page: number) => {
      setCurrentPage(page)
      void runSearch({ page })
    },
    [runSearch],
  )

  const handlePageSizeChange = React.useCallback(
    (size: number) => {
      setPageSize(size)
      setCurrentPage(1)
      void runSearch({ page: 1, pageSize: size })
    },
    [runSearch],
  )

  const handleDocFilter = React.useCallback(
    (docId: string, checked: boolean) => {
      setSelectedDocIds((prev) => {
        const next = checked
          ? [...prev, docId]
          : prev.filter((id) => id !== docId)
        setCurrentPage(1)
        void runSearch({ page: 1, selectedDocIds: next })
        return next
      })
    },
    [runSearch],
  )

  const handleClearDocFilter = React.useCallback(() => {
    setSelectedDocIds([])
    setCurrentPage(1)
    void runSearch({ page: 1, selectedDocIds: [] })
  }, [runSearch])

  const handleSelectAllDocs = React.useCallback(() => {
    const next = latestArgsRef.current
    const allIds = docAggs.map((doc) => doc.doc_id)
    setSelectedDocIds(allIds)
    setCurrentPage(1)
    void runSearch({ page: 1, selectedDocIds: allIds })
    // touch latest to keep closure honest for linting
    void next
  }, [docAggs, runSearch])

  const toggleDocFilter = React.useCallback(() => {
    setShowDocFilter((open) => !open)
  }, [])

  React.useEffect(() => {
    if (docAggs.length > 0 && !showDocFilter && hasSearched) {
      setShowDocFilter(true)
    }
  }, [docAggs.length, hasSearched, showDocFilter])

  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))
  const pageNumbers = React.useMemo(() => {
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
      if (totalPages <= 5) return i + 1
      if (currentPage <= 3) return i + 1
      if (currentPage >= totalPages - 2) return totalPages - 4 + i
      return currentPage - 2 + i
    })
  }, [currentPage, totalPages])

  return {
    query,
    setQuery,
    isSearching,
    results,
    totalResults,
    docAggs,
    selectedDocIds,
    showDocFilter,
    pageSize,
    currentPage,
    hasSearched,
    totalPages,
    pageNumbers,
    runSearch,
    handleSearchSubmit,
    handlePageChange,
    handlePageSizeChange,
    handleDocFilter,
    handleClearDocFilter,
    handleSelectAllDocs,
    toggleDocFilter,
  }
}
