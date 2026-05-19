import { useCallback, useState } from 'react'
import type { ChunkData } from '../types'

export const useChunkSelection = () => {
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([])

  const selectAll = useCallback((checked: boolean, ids: string[]) => {
    setSelectedChunkIds(checked ? ids : [])
  }, [])

  const toggleSingle = useCallback((chunkId: string, checked: boolean) => {
    setSelectedChunkIds((prev) => {
      const index = prev.indexOf(chunkId)
      if (checked && index === -1) return [...prev, chunkId]
      if (!checked && index !== -1) return prev.filter((id) => id !== chunkId)
      return prev
    })
  }, [])

  const clear = useCallback(() => {
    setSelectedChunkIds((prev) => (prev.length === 0 ? prev : []))
  }, [])

  const isAllSelected = (filteredChunks: ChunkData[]) =>
    filteredChunks.length > 0 &&
    selectedChunkIds.length === filteredChunks.length

  const isPartialSelected = (filteredChunks: ChunkData[]) =>
    selectedChunkIds.length > 0 &&
    selectedChunkIds.length < filteredChunks.length

  return {
    selectedChunkIds,
    selectAll,
    toggleSingle,
    clear,
    isAllSelected,
    isPartialSelected,
    hasSelected: selectedChunkIds.length > 0,
    selectedCount: selectedChunkIds.length,
  }
}

export type ChunkSelection = ReturnType<typeof useChunkSelection>
