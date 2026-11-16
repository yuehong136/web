import { memo, useCallback, useSyncExternalStore, type RefObject } from 'react'
import type { ForceGraphHandle } from './force-graph'
import { GraphToolbar } from './graph-toolbar'

function subscribeFullscreen(listener: () => void) {
  document.addEventListener('fullscreenchange', listener)
  return () => document.removeEventListener('fullscreenchange', listener)
}

interface GraphControlsProps {
  graphRef: RefObject<ForceGraphHandle | null>
  fullscreenTargetRef: RefObject<HTMLDivElement | null>
}

function GraphControlsComponent({
  graphRef,
  fullscreenTargetRef,
}: GraphControlsProps) {
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

  const getFullscreenState = useCallback(() => {
    const target = getFullscreenTarget()
    return target !== null && document.fullscreenElement === target
  }, [getFullscreenTarget])
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenState,
    () => false,
  )

  const handleFullscreen = useCallback(() => {
    const element = getFullscreenTarget()
    if (!element || typeof element.requestFullscreen !== 'function') {
      return
    }

    if (!document.fullscreenElement) {
      void element.requestFullscreen().catch(() => {})
    } else if (typeof document.exitFullscreen === 'function') {
      void document.exitFullscreen().catch(() => {})
    }
  }, [getFullscreenTarget])

  return (
    <GraphToolbar
      isFullscreen={isFullscreen}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onFitView={handleFitView}
      onFullscreen={handleFullscreen}
    />
  )
}

export const GraphControls = memo(GraphControlsComponent)
