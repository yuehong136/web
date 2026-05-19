import { useCallback, useMemo, useState } from 'react'
import { useResizablePanels } from '../use-resizable-panels'
import type { CSSVarStyle } from '../types'

export const useChunkPanelLayout = () => {
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(true)
  const [previewPanelWidth, setPreviewPanelWidth] = useState(560)
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true)
  const [infoPanelWidth, setInfoPanelWidth] = useState(320)

  const handleResizeStart = useResizablePanels({
    setPreviewPanelWidth,
    setInfoPanelWidth,
  })

  const previewPanelStyle = useMemo<CSSVarStyle>(
    () => ({ '--preview-panel-width': `${previewPanelWidth}px` }),
    [previewPanelWidth],
  )

  const infoPanelStyle = useMemo<CSSVarStyle>(
    () => ({ '--info-panel-width': `${infoPanelWidth}px` }),
    [infoPanelWidth],
  )

  const openPreview = useCallback(() => setIsPreviewPanelOpen(true), [])
  const closePreview = useCallback(() => setIsPreviewPanelOpen(false), [])
  const openInfo = useCallback(() => setIsInfoPanelOpen(true), [])
  const closeInfo = useCallback(() => setIsInfoPanelOpen(false), [])

  return {
    isPreviewPanelOpen,
    previewPanelWidth,
    isInfoPanelOpen,
    infoPanelWidth,
    previewPanelStyle,
    infoPanelStyle,
    handleResizeStart,
    openPreview,
    closePreview,
    openInfo,
    closeInfo,
  }
}

export type ChunkPanelLayout = ReturnType<typeof useChunkPanelLayout>
