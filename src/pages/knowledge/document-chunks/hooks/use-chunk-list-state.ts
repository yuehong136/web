import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  const { docId } = useParams<{ id: string; docId: string }>()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filterStatus, setFilterStatus] = useState<ChunkFilterStatus>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [textMode, setTextMode] = useState<TextMode>('ellipse')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const debouncedSearchKeyword = useDebouncedValue(searchKeyword.trim(), 400)

  const availableInt = useMemo(() => {
    if (filterStatus === 'enabled') return 1
    if (filterStatus === 'disabled') return 0
    return undefined
  }, [filterStatus])

  const {
    data: chunkListData,
    isFetching,
    isLoading,
    error,
    refetch: refetchChunkList,
  } = useQuery({
    queryKey: documentKeys.chunkList(
      docId,
      page,
      pageSize,
      debouncedSearchKeyword,
      availableInt,
    ),
    enabled: Boolean(docId),
    gcTime: 0,
    queryFn: async () => {
      return knowledgeAPI.document.listChunks({
        doc_id: docId!,
        page,
        size: pageSize,
        keywords: debouncedSearchKeyword || undefined,
        available_int: availableInt,
      })
    },
    placeholderData: (previousData) => previousData,
  })

  const chunks = useMemo<ChunkData[]>(
    () => (chunkListData?.chunks ?? []) as ChunkData[],
    [chunkListData],
  )
  const total = chunkListData?.total ?? 0
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

  useEffect(() => {
    setPage(1)
  }, [filterStatus, debouncedSearchKeyword])

  const delayedRefetchChunkList = useCallback(() => {
    setTimeout(() => refetchChunkList(), 500)
  }, [refetchChunkList])

  return {
    docId,
    page,
    pageSize,
    filterStatus,
    searchKeyword,
    debouncedSearchKeyword,
    textMode,
    isSearchOpen,
    setPage,
    setPageSize,
    setFilterStatus,
    setSearchKeyword,
    setTextMode,
    setIsSearchOpen,
    chunks,
    filteredChunks,
    total,
    docInfo,
    loading,
    error,
    refetchChunkList,
    delayedRefetchChunkList,
  }
}

export type ChunkListState = ReturnType<typeof useChunkListState>
