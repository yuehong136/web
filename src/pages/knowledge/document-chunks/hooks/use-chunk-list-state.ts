import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { knowledgeAPI } from '@/api/knowledge'
import { documentKeys } from '@/hooks/use-document-request'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type {
  ChunkData,
  ChunkFilterStatus,
  ChunkListDocument,
  TextMode,
} from '../types'

export const useChunkListState = () => {
  const { id: kbId, docId } = useParams<{ id: string; docId: string }>()
  const ownerKey = `${kbId}:${docId}`
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filterStatus, setFilterStatus] = useState<ChunkFilterStatus>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [textMode, setTextMode] = useState<TextMode>('ellipse')

  const debouncedSearch = useDebouncedValue(
    `${ownerKey}\0${searchKeyword.trim()}`,
    400,
  )
  const searchPrefix = `${ownerKey}\0`
  const debouncedSearchKeyword = debouncedSearch.startsWith(searchPrefix)
    ? debouncedSearch.slice(searchPrefix.length)
    : ''

  const [previousOwner, setPreviousOwner] = useState(ownerKey)
  if (previousOwner !== ownerKey) {
    setPreviousOwner(ownerKey)
    setPage(1)
    setFilterStatus('all')
    setSearchKeyword('')
  }

  const [previousFilter, setPreviousFilter] = useState({
    filterStatus,
    debouncedSearchKeyword,
  })
  if (
    previousFilter.filterStatus !== filterStatus ||
    previousFilter.debouncedSearchKeyword !== debouncedSearchKeyword
  ) {
    setPreviousFilter({ filterStatus, debouncedSearchKeyword })
    setPage(1)
  }

  const availableInt = useMemo(() => {
    if (filterStatus === 'enabled') return 1
    if (filterStatus === 'disabled') return 0
    return undefined
  }, [filterStatus])

  const {
    data: chunkListData,
    isFetching,
    isLoading,
    isPlaceholderData,
    error,
    refetch: refetchChunkList,
  } = useQuery({
    queryKey: documentKeys.chunkList(
      docId,
      page,
      pageSize,
      debouncedSearchKeyword,
      availableInt,
      kbId,
    ),
    enabled: Boolean(kbId && docId),
    meta: { kbId, docId },
    gcTime: 0,
    queryFn: async () => {
      return knowledgeAPI.document.listChunks({
        kb_id: kbId!,
        doc_id: docId!,
        page,
        size: pageSize,
        keywords: debouncedSearchKeyword || undefined,
        available_int: availableInt,
      })
    },
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.meta?.kbId === kbId && previousQuery?.meta?.docId === docId
        ? previousData
        : undefined,
  })

  const chunks = useMemo<ChunkData[]>(
    () => (chunkListData?.chunks ?? []) as ChunkData[],
    [chunkListData],
  )
  const total = chunkListData?.total ?? 0
  if (
    chunkListData &&
    chunkListData.chunks.length === 0 &&
    !isPlaceholderData &&
    !isFetching
  ) {
    const lastPage = Math.max(1, Math.ceil(total / pageSize))
    if (page > lastPage) setPage(lastPage)
  }
  const docInfo = (chunkListData?.doc ?? null) as ChunkListDocument | null
  const loading = (isLoading || isFetching) && !chunkListData

  const filteredChunks = useMemo(() => {
    if (filterStatus === 'all') return chunks
    return chunks.filter((chunk) =>
      filterStatus === 'enabled'
        ? chunk.available_int === 1
        : chunk.available_int === 0,
    )
  }, [chunks, filterStatus])

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    },
    [ownerKey],
  )
  const delayedRefetchChunkList = useCallback(() => {
    if (!kbId || !docId) return
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null
      void queryClient.invalidateQueries({
        queryKey: documentKeys.documentChunkList(docId),
        predicate: (query) => query.meta?.kbId === kbId,
      })
    }, 500)
  }, [docId, kbId, queryClient])

  return {
    kbId,
    docId,
    page,
    pageSize,
    filterStatus,
    searchKeyword,
    debouncedSearchKeyword,
    textMode,
    setPage,
    setPageSize,
    setFilterStatus,
    setSearchKeyword,
    setTextMode,
    chunks,
    filteredChunks,
    total,
    docInfo,
    loading,
    isRefreshing: isFetching && Boolean(chunkListData),
    isPlaceholderData,
    error,
    refetchChunkList,
    delayedRefetchChunkList,
  }
}

export type ChunkListState = ReturnType<typeof useChunkListState>
