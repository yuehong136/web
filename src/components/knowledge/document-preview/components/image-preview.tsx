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

  if (!objectUrl) {
    return (
      <ErrorState
        icon={<ImageIcon className="h-16 w-16" />}
        title={t('knowledge.preview.imageLoadFailed')}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-background-subtle">
      <div className="flex items-center justify-center gap-1 border-b border-border-default bg-background-surface px-4 py-2">
        <Tooltip content={t('knowledge.preview.zoomOut')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </Tooltip>
        <span className="min-w-[50px] text-center font-mono text-xs text-text-secondary">
          {Math.round(scale * 100)}%
        </span>
        <Tooltip content={t('knowledge.preview.zoomIn')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </Tooltip>
        <div className="mx-2 h-4 w-px bg-border-default" />
        <Tooltip content={t('knowledge.preview.rotate90')}>
          <Button variant="ghost" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip content={t('knowledge.preview.reset')}>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      <button
        type="button"
        className={cn(
          'flex flex-1 items-center justify-center overflow-hidden p-4 text-left',
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
          className="max-h-full max-w-full select-none object-contain transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
        />
      </button>
    </div>
  )
}

export const ImagePreview = memo(ImagePreviewInner)
