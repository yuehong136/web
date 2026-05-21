import { memo, useCallback, useEffect, useState, type RefObject } from 'react'
import type { ForceGraphHandle } from './force-graph'
import type { GraphStats } from '../types'
import { GraphStatsBadge } from './graph-stats-badge'
import { GraphToolbar } from './graph-toolbar'

interface GraphControlsProps {
  graphRef: RefObject<ForceGraphHandle | null>
  fullscreenTargetRef: RefObject<HTMLDivElement | null>
  stats: GraphStats
}

function GraphControlsComponent({
  graphRef,
  fullscreenTargetRef,
  stats,
}: GraphControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleZoomIn = useCallback(() => graphRef.current?.zoomIn(), [graphRef])
  const handleZoomOut = useCallback(
    () => graphRef.current?.zoomOut(),
    [graphRef],
  )
  const handleFitView = useCallback(
    () => graphRef.current?.fitView(),
    [graphRef],
  )

  const getFullscreenTarget = useCallback(
    () => fullscreenTargetRef?.current ?? null,
    [fullscreenTargetRef],
  )

  const syncFullscreenState = useCallback(() => {
    setIsFullscreen(document.fullscreenElement === getFullscreenTarget())
  }, [getFullscreenTarget])

  useEffect(() => {
    syncFullscreenState()
    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
    }
  }, [syncFullscreenState])

  const handleFullscreen = useCallback(() => {
    const element = getFullscreenTarget()
    if (!element || typeof element.requestFullscreen !== 'function') {
      syncFullscreenState()
      return
    }

    const syncAfterRequest = () => syncFullscreenState()
    if (!document.fullscreenElement) {
      void element
        .requestFullscreen()
        .catch(() => {})
        .finally(syncAfterRequest)
    } else if (typeof document.exitFullscreen === 'function') {
      void document
        .exitFullscreen()
        .catch(() => {})
        .finally(syncAfterRequest)
    } else {
      syncFullscreenState()
    }
  }, [getFullscreenTarget, syncFullscreenState])

  return (
    <>
      <GraphStatsBadge stats={stats} />
      <GraphToolbar
        isFullscreen={isFullscreen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onFullscreen={handleFullscreen}
      />
    </>
  )
}

export const GraphControls = memo(GraphControlsComponent)
