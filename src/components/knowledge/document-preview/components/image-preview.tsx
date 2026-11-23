import {
  memo,
  useRef,
  useState,
  type FC,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import {
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ErrorState } from './preview-state'

const ImagePreviewInner: FC<{
  objectUrl?: string
  sourceUrl: string
  alt?: string
}> = ({ objectUrl, sourceUrl, alt }) => {
  const { t } = useTranslation()
  const [failedUrl, setFailedUrl] = useState<string>()
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 5))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.1))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)
  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (event: MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        posX: position.x,
        posY: position.y,
      }
    }
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging && scale > 1) {
      const dx = event.clientX - dragStartRef.current.x
      const dy = event.clientY - dragStartRef.current.y
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (scale <= 1) return

    const offset = event.shiftKey ? 48 : 16
    switch (event.key) {
      case 'ArrowUp':
        setPosition((current) => ({ ...current, y: current.y + offset }))
        break
      case 'ArrowDown':
        setPosition((current) => ({ ...current, y: current.y - offset }))
        break
      case 'ArrowLeft':
        setPosition((current) => ({ ...current, x: current.x + offset }))
        break
      case 'ArrowRight':
        setPosition((current) => ({ ...current, x: current.x - offset }))
        break
      default:
        return
    }
    event.preventDefault()
  }

  if (!objectUrl || failedUrl === objectUrl) {
    return (
      <ErrorState
        icon={<ImageIcon />}
        title={t('knowledge.preview.imageLoadFailed')}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-sunken">
      <div className="flex items-center justify-center gap-space-2xs border-b border-line-subtle bg-surface px-space-md py-space-xs">
        <Tooltip content={t('knowledge.preview.zoomOut')}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.1}
            aria-label={t('knowledge.preview.zoomOut')}
          >
            <ZoomOut className="size-icon-sm" aria-hidden="true" />
          </Button>
        </Tooltip>
        <span className="min-w-12 text-center font-mono text-xs text-fg-muted tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Tooltip content={t('knowledge.preview.zoomIn')}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomIn}
            disabled={scale >= 5}
            aria-label={t('knowledge.preview.zoomIn')}
          >
            <ZoomIn className="size-icon-sm" aria-hidden="true" />
          </Button>
        </Tooltip>
        <div aria-hidden="true" className="mx-space-xs h-4 w-px bg-line" />
        <Tooltip content={t('knowledge.preview.rotate90')} asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRotate}
            aria-label={t('knowledge.preview.rotate90')}
          >
            <RotateCw className="size-icon-sm" aria-hidden="true" />
          </Button>
        </Tooltip>
        <Tooltip content={t('knowledge.preview.reset')} asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReset}
            aria-label={t('knowledge.preview.reset')}
          >
            <RotateCcw className="size-icon-sm" aria-hidden="true" />
          </Button>
        </Tooltip>
      </div>

      <button
        type="button"
        className={cn(
          'flex flex-1 items-center justify-center overflow-hidden p-space-base text-left outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-inset',
          scale > 1 && 'cursor-grab',
          isDragging && 'cursor-grabbing',
        )}
        aria-label={t('knowledge.preview.imagePreview')}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={handleKeyDown}
      >
        <img
          src={objectUrl}
          alt={alt || t('knowledge.preview.imagePreview')}
          className="max-h-full max-w-full object-contain transition-transform duration-(--motion-panel) select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
          onError={() => setFailedUrl(objectUrl)}
        />
      </button>
    </div>
  )
}

export const ImagePreview = memo(ImagePreviewInner)
