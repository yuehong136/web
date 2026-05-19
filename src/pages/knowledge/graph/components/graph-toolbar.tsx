import { useTranslation } from 'react-i18next'
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'

interface GraphToolbarProps {
  isFullscreen: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onFullscreen: () => void
}

export function GraphToolbar({
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onFitView,
  onFullscreen,
}: GraphToolbarProps) {
  const { t } = useTranslation()
  const fullscreenLabel = isFullscreen
    ? t('knowledge.graph.controls.exitFullscreen')
    : t('knowledge.graph.controls.fullscreen')

  return (
    <div className="rounded-radius-xl shadow-elevation-high absolute bottom-4 right-4 z-10 flex flex-col gap-1 border border-components-workspace-border bg-components-workspace-surface p-1 backdrop-blur">
      <Tooltip content={t('knowledge.graph.controls.zoomIn')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onZoomIn}
          aria-label={t('knowledge.graph.controls.zoomIn')}
        >
          <ZoomIn className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content={t('knowledge.graph.controls.zoomOut')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onZoomOut}
          aria-label={t('knowledge.graph.controls.zoomOut')}
        >
          <ZoomOut className="size-4" />
        </Button>
      </Tooltip>
      <div className="mx-1.5 h-px bg-components-workspace-border" />
      <Tooltip content={t('knowledge.graph.controls.fitView')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onFitView}
          aria-label={t('knowledge.graph.controls.fitView')}
        >
          <Maximize2 className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content={fullscreenLabel}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onFullscreen}
          aria-label={fullscreenLabel}
        >
          {isFullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </Button>
      </Tooltip>
    </div>
  )
}
