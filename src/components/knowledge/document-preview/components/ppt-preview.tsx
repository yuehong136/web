import { memo, useEffect, useRef, useState, type FC } from 'react'
import { Presentation, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ErrorState, LoadingState } from './preview-state'

const PptPreviewInner: FC<{
  arrayBuffer?: ArrayBuffer
  sourceUrl: string
}> = ({ arrayBuffer, sourceUrl }) => {
  const { t } = useTranslation()
  const measureRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slideCount, setSlideCount] = useState(0)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    let mounted = true

    const loadPpt = async () => {
      if (!measureRef.current || !wrapperRef.current) return

      try {
        setLoading(true)
        setError(null)
        setSlideCount(0)
        wrapperRef.current.innerHTML = ''

        const pptxPreview = await import('pptx-preview')

        if (!arrayBuffer) {
          throw new Error(t('knowledge.preview.pptPreviewFailed'))
        }
        if (!mounted || !measureRef.current || !wrapperRef.current) return

        const slideWidth = Math.max(measureRef.current.clientWidth - 64, 480)
        const slideHeight = Math.round((slideWidth * 9) / 16)

        const pptPreviewer = pptxPreview.init(wrapperRef.current, {
          width: slideWidth,
          height: slideHeight,
        })
        await pptPreviewer.preview(arrayBuffer)

        if (mounted) {
          const slides = wrapperRef.current?.querySelectorAll(
            '.slide-wrapper, [class*="slide"]',
          )
          setSlideCount(slides?.length ?? 0)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('PPT preview error:', err)
          setError(
            err instanceof Error
              ? err.message
              : t('knowledge.preview.pptPreviewFailed'),
          )
          setLoading(false)
        }
      }
    }

    loadPpt()
    return () => {
      mounted = false
    }
  }, [arrayBuffer, t])

  if (error) {
    return (
      <ErrorState
        icon={<Presentation className="h-16 w-16" />}
        title={t('knowledge.preview.pptPreviewFailed')}
        message={error}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="ppt-previewer flex h-full w-full flex-col" ref={measureRef}>
      <div className="px-space-md py-space-sm bg-surface-primary flex shrink-0 items-center justify-between border-b border-border-default">
        <div className="gap-space-xs flex items-center text-text-secondary">
          <Presentation className="h-4 w-4 shrink-0" />
          {!loading && slideCount > 0 && (
            <span className="text-sm">
              {t('knowledge.preview.slideCount', { count: slideCount })}
            </span>
          )}
          {loading && (
            <span className="text-sm">{t('knowledge.preview.loading')}</span>
          )}
        </div>
        <div className="gap-space-xs flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            disabled={zoom <= 50 || loading}
            className="h-7 w-7 p-0"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[3rem] text-center text-sm tabular-nums text-text-secondary">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            disabled={zoom >= 200 || loading}
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(100)}
            disabled={zoom === 100 || loading}
            className="h-7 w-7 p-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="ppt-scroll-area relative flex-1 overflow-auto">
        {loading && (
          <div className="absolute inset-0 z-10">
            <LoadingState message={t('knowledge.preview.loadingPpt')} />
          </div>
        )}
        <div
          className={cn('py-space-lg', loading && 'invisible')}
          style={{
            zoom: `${zoom}%`,
            minWidth: zoom < 100 ? `${10000 / zoom}%` : undefined,
          }}
        >
          <div ref={wrapperRef} />
        </div>
      </div>
    </div>
  )
}

export const PptPreview = memo(PptPreviewInner)
