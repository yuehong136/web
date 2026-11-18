import { useTranslation } from 'react-i18next'
import { Maximize2, Scan, Minimize2, ZoomIn, ZoomOut } from 'lucide-react'
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
    <div className="absolute right-space-md bottom-space-md z-10 flex flex-col gap-space-2xs rounded-radius-lg border border-line bg-surface p-space-2xs shadow-elevation-medium">
      <Tooltip content={t('knowledge.graph.controls.zoomIn')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onZoomIn}
          aria-label={t('knowledge.graph.controls.zoomIn')}
        >
          <ZoomIn className="size-icon-sm" />
        </Button>
      </Tooltip>
      <Tooltip content={t('knowledge.graph.controls.zoomOut')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onZoomOut}
          aria-label={t('knowledge.graph.controls.zoomOut')}
        >
          <ZoomOut className="size-icon-sm" />
        </Button>
      </Tooltip>
      <div aria-hidden="true" className="mx-space-xs h-px bg-line-subtle" />
      <Tooltip content={t('knowledge.graph.controls.fitView')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onFitView}
          aria-label={t('knowledge.graph.controls.fitView')}
        >
          <Scan className="size-icon-sm" />
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
            <Minimize2 className="size-icon-sm" />
          ) : (
            <Maximize2 className="size-icon-sm" />
          )}
        </Button>
      </Tooltip>
    </div>
  )
}
