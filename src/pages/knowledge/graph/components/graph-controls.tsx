import React, { memo, useCallback, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Minimize2, CircleDot, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ForceGraphHandle } from './force-graph'
import type { GraphStats } from '../types'

interface GraphControlsProps {
  graphRef: React.RefObject<ForceGraphHandle | null>
  stats: GraphStats
}

const GraphControls: React.FC<GraphControlsProps> = ({ graphRef, stats }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleZoomIn = useCallback(() => graphRef.current?.zoomIn(), [graphRef])
  const handleZoomOut = useCallback(() => graphRef.current?.zoomOut(), [graphRef])
  const handleFitView = useCallback(() => graphRef.current?.fitView(), [graphRef])

  const handleFullscreen = useCallback(() => {
    const el = document.querySelector('[data-graph-container]')?.parentElement
    if (!el) return

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  return (
    <>
      {/* Stats badge - top left */}
      <div
        className="absolute top-3 left-3 flex items-center gap-3 px-3 py-2 rounded-lg text-xs z-10"
        style={{
          backgroundColor: 'var(--color-background-default)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          backdropFilter: 'blur(8px)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5" style={{ color: 'var(--color-text-accent)' }} />
          {stats.nodeCount} 节点
        </span>
        <span
          className="w-px h-3"
          style={{ backgroundColor: 'var(--color-border-default)' }}
        />
        <span className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" style={{ color: 'var(--color-text-accent)' }} />
          {stats.edgeCount} 关系
        </span>
      </div>

      {/* Zoom controls - bottom right */}
      <div
        className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-xl p-1 z-10"
        style={{
          backgroundColor: 'var(--color-background-default)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleZoomIn}
          title="放大"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleZoomOut}
          title="缩小"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div
          className="mx-1.5 h-px"
          style={{ backgroundColor: 'var(--color-border-subtle)' }}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleFitView}
          title="适应屏幕"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleFullscreen}
          title={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </>
  )
}

export default memo(GraphControls)
export { GraphControls }
