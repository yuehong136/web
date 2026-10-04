import { useCallback, useState } from 'react'

export const useChunkPanelLayout = () => {
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(false)
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false)

  const togglePreview = useCallback(
    () => setIsPreviewPanelOpen((open) => !open),
    [],
  )
  const closePreview = useCallback(() => setIsPreviewPanelOpen(false), [])
  const openInfo = useCallback(() => setIsInfoPanelOpen(true), [])
  const closeInfo = useCallback(() => setIsInfoPanelOpen(false), [])

  return {
    isPreviewPanelOpen,
    isInfoPanelOpen,
    togglePreview,
    closePreview,
    openInfo,
    closeInfo,
  }
}

export type ChunkPanelLayout = ReturnType<typeof useChunkPanelLayout>
