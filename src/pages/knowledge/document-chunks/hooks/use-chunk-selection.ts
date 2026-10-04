import { useCallback, useState } from 'react'
import type { ChunkData } from '../types'

export const useChunkSelection = (ownerKey = '') => {
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

  const [previousOwner, setPreviousOwner] = useState(ownerKey)
  if (previousOwner !== ownerKey) {
    setPreviousOwner(ownerKey)
    clear()
  }

  const isAllSelected = (filteredChunks: ChunkData[]) =>
    filteredChunks.length > 0 &&
    filteredChunks.every((chunk) => selectedChunkIds.includes(chunk.chunk_id))

  const isPartialSelected = (filteredChunks: ChunkData[]) =>
    filteredChunks.some((chunk) => selectedChunkIds.includes(chunk.chunk_id)) &&
    !isAllSelected(filteredChunks)

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
