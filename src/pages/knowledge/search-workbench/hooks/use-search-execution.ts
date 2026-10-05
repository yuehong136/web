import React from 'react'

import { APIError } from '@/api/client'
import { knowledgeAPI } from '@/api/knowledge'

import { toRetrievalResultViewList } from '../adapters/retrieval-result'
import { DEFAULT_PAGE_SIZE, FUSION_DEFAULT_WEIGHTS } from '../constants'
import type {
  RetrievalDocAgg,
  RetrievalMetaDataFilter,
  RetrievalResultView,
  SearchConfigState,
  SearchMode,
  SearchParams,
  SearchRequestScope,
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
  config?: Partial<
    Pick<
      SearchConfigState,
      | 'searchParams'
      | 'searchMode'
      | 'selectedLanguages'
      | 'activeMetaDataFilter'
    >
  >
}

type SearchRequest = Parameters<typeof knowledgeAPI.retrievalTest.test>[0]
export type SearchError = 'failed' | 'access' | 'network' | 'graphScope'

export interface UseSearchExecutionResult {
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
  isSearching: boolean
  results: RetrievalResultView[]
  totalResults: number
  docAggs: RetrievalDocAgg[]
  docOptions: RetrievalDocAgg[]
  selectedDocIds: string[]
  showDocFilter: boolean
  pageSize: number
  currentPage: number
  hasSearched: boolean
  searchError: SearchError | undefined
  requestScope: SearchRequestScope | undefined
  totalPages: number
  pageNumbers: number[]
  runSearch: (override?: SearchOverride) => Promise<void>
  retrySearch: () => void
  handleSearchSubmit: () => void
  handlePageChange: (page: number) => void
  handlePageSizeChange: (size: number) => void
  handleDocFilter: (docId: string, checked: boolean) => void
  handleClearDocFilter: () => void
  handleSelectAllDocs: () => void
  toggleDocFilter: () => void
  commitConfigPageSize: (size: number) => void
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
  const [docOptions, setDocOptions] = React.useState<RetrievalDocAgg[]>([])
  const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>([])
  const [showDocFilter, setShowDocFilter] = React.useState(true)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [hasSearched, setHasSearched] = React.useState(false)
  const [searchError, setSearchError] = React.useState<SearchError>()
  const [requestScope, setRequestScope] = React.useState<SearchRequestScope>()
  const requestIdRef = React.useRef(0)
  const lastRequestRef = React.useRef<SearchRequest | undefined>(undefined)
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

  React.useLayoutEffect(() => {
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
  }, [
    query,
    searchParams,
    searchMode,
    selectedLanguages,
    activeMetaDataFilter,
    pageSize,
    selectedDocIds,
    currentPage,
  ])

  React.useEffect(
    () => () => {
      requestIdRef.current += 1
    },
    [kbId],
  )

  const executeRequest = React.useCallback(async (data: SearchRequest) => {
    const myRequestId = ++requestIdRef.current
    lastRequestRef.current = data
    setRequestScope({
      question: data.question,
      docIds: [...(data.doc_ids ?? [])],
      metadata: data.meta_data_filter,
      similarityThreshold: data.similarity_threshold ?? 0,
    })
    setIsSearching(true)
    setHasSearched(true)
    setSearchError(undefined)
    // Graph retrieval currently receives dataset IDs only and may add sources
    // outside doc_ids. Do not send a request that appears scoped but can broaden.
    if (data.use_kg && (data.doc_ids?.length || data.meta_data_filter)) {
      setSearchError('graphScope')
      setResults([])
      setTotalResults(0)
      setDocAggs([])
      setIsSearching(false)
      return
    }
    try {
      const response = await knowledgeAPI.retrievalTest.test(data)
      if (myRequestId !== requestIdRef.current) return
      setResults(toRetrievalResultViewList(response.chunks))
      setTotalResults(response.total)
      setDocAggs(response.doc_aggs)
      // Keep choices from the broader result set so another source can still be
      // selected, and zero matches never trap the user in a hidden restriction.
      setDocOptions((previous) => {
        if (!data.doc_ids?.length) return response.doc_aggs
        const options = new Map(previous.map((doc) => [doc.doc_id, doc]))
        for (const doc of response.doc_aggs) options.set(doc.doc_id, doc)
        for (const id of data.doc_ids)
          if (!options.has(id))
            options.set(id, { doc_id: id, doc_name: id, count: 0 })
        return [...options.values()]
      })
    } catch (error) {
      if (myRequestId !== requestIdRef.current) return
      setSearchError(
        error instanceof APIError &&
          ([401, 403].includes(error.status) ||
            ['109', 'UNAUTHORIZED', 'FORBIDDEN'].includes(error.code))
          ? 'access'
          : error instanceof APIError && [0, 408].includes(error.status)
            ? 'network'
            : 'failed',
      )
      setResults([])
      setTotalResults(0)
      setDocAggs([])
    } finally {
      if (myRequestId === requestIdRef.current) setIsSearching(false)
    }
  }, [])

  const runSearch = React.useCallback(
    async (override?: SearchOverride) => {
      if (!kbId) return
      const latest = latestArgsRef.current
      const question = latest.query.trim()
      if (!question) return
      const config = override?.config
      const params = config?.searchParams ?? latest.searchParams
      const mode = config?.searchMode ?? latest.searchMode
      const languages = config?.selectedLanguages ?? latest.selectedLanguages
      // Explicit undefined clears filtering when Apply switches to Disabled.
      const metadata =
        config && Object.hasOwn(config, 'activeMetaDataFilter')
          ? config.activeMetaDataFilter
          : latest.activeMetaDataFilter
      const docs = override?.selectedDocIds ?? latest.selectedDocIds
      await executeRequest({
        kb_ids: [kbId],
        question,
        ...params,
        page: override?.page ?? latest.currentPage,
        size: override?.pageSize ?? latest.pageSize,
        doc_ids: docs.length ? [...docs] : null,
        cross_languages: languages.length ? [...languages] : null,
        meta_data_filter: metadata,
        search_mode:
          mode.type === 'fusion'
            ? {
                type: 'fusion',
                weights: mode.weights || FUSION_DEFAULT_WEIGHTS,
              }
            : { ...mode },
      })
    },
    [kbId, executeRequest],
  )

  const retrySearch = React.useCallback(() => {
    if (lastRequestRef.current) void executeRequest(lastRequestRef.current)
  }, [executeRequest])

  const handleSearchSubmit = React.useCallback(() => {
    setCurrentPage(1)
    void runSearch({ page: 1 })
  }, [runSearch])

  const handlePageChange = React.useCallback(
    (page: number) => {
      if (!lastRequestRef.current) return
      setCurrentPage(page)
      void executeRequest({ ...lastRequestRef.current, page })
    },
    [executeRequest],
  )

  const handlePageSizeChange = React.useCallback(
    (size: number) => {
      setPageSize(size)
      setCurrentPage(1)
      if (lastRequestRef.current)
        void executeRequest({ ...lastRequestRef.current, page: 1, size })
    },
    [executeRequest],
  )

  const applyDocSelection = React.useCallback(
    (next: string[]) => {
      latestArgsRef.current.selectedDocIds = next
      setSelectedDocIds(next)
      setCurrentPage(1)
      if (lastRequestRef.current)
        void executeRequest({
          ...lastRequestRef.current,
          page: 1,
          doc_ids: next.length ? next : null,
        })
    },
    [executeRequest],
  )

  const handleDocFilter = React.useCallback(
    (docId: string, checked: boolean) => {
      const previous = latestArgsRef.current.selectedDocIds
      applyDocSelection(
        checked
          ? [...new Set([...previous, docId])]
          : previous.filter((id) => id !== docId),
      )
    },
    [applyDocSelection],
  )

  const handleClearDocFilter = React.useCallback(
    () => applyDocSelection([]),
    [applyDocSelection],
  )
  const handleSelectAllDocs = React.useCallback(() => {
    applyDocSelection(docOptions.map((doc) => doc.doc_id))
  }, [applyDocSelection, docOptions])
  const toggleDocFilter = React.useCallback(
    () => setShowDocFilter((open) => !open),
    [],
  )
  const commitConfigPageSize = React.useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))
  const pageNumbers = React.useMemo(
    () =>
      Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1
        if (currentPage <= 3) return i + 1
        if (currentPage >= totalPages - 2) return totalPages - 4 + i
        return currentPage - 2 + i
      }),
    [currentPage, totalPages],
  )

  return {
    query,
    setQuery,
    isSearching,
    results,
    totalResults,
    docAggs,
    docOptions,
    selectedDocIds,
    showDocFilter,
    pageSize,
    currentPage,
    hasSearched,
    searchError,
    requestScope,
    totalPages,
    pageNumbers,
    runSearch,
    retrySearch,
    handleSearchSubmit,
    handlePageChange,
    handlePageSizeChange,
    handleDocFilter,
    handleClearDocFilter,
    handleSelectAllDocs,
    toggleDocFilter,
    commitConfigPageSize,
  }
}
