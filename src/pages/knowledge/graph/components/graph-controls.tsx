import { memo, useCallback, useState, type RefObject } from 'react'
import type { ForceGraphHandle } from './force-graph'
import type { GraphStats } from '../types'
import { GraphStatsBadge } from './graph-stats-badge'
import { GraphToolbar } from './graph-toolbar'

interface GraphControlsProps {
  graphRef: RefObject<ForceGraphHandle | null>
  stats: GraphStats
}

function GraphControlsComponent({ graphRef, stats }: GraphControlsProps) {
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

  const handleFullscreen = useCallback(() => {
    const element = document.querySelector(
      '[data-graph-container]',
    )?.parentElement
    if (!element) return

    if (!document.fullscreenElement) {
      element
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {})
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {})
    }
  }, [])

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
