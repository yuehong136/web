import { memo, useCallback, useEffect, useRef, useState, type FC } from 'react'
import { FileText, ScanLine, ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState } from './preview-state'
import { renderDocxDocument, stepDocxZoom } from './docx-document'

interface DocumentResult {
  input?: ArrayBuffer
  html?: string
  failed?: boolean
}

const DocxPreviewInner: FC<{
  arrayBuffer?: ArrayBuffer
  sourceUrl: string
}> = ({ arrayBuffer, sourceUrl }) => {
  const { t } = useTranslation()
  const frame = useRef<HTMLIFrameElement>(null)
  const [result, setResult] = useState<DocumentResult>({})
  const [zoom, setZoom] = useState<number | null>(null)
  const [layout, setLayout] = useState({ width: 0, pages: 0, viewport: 0 })
  const ready = result.input === arrayBuffer && Boolean(result.html)
  const failed = result.input === arrayBuffer && result.failed
  const fitZoom = layout.width
    ? Math.max(
        5,
        Math.min(
          100,
          Math.floor(((layout.viewport - 32) / layout.width) * 100),
        ),
      )
    : 100
  const scale = zoom ?? fitZoom

  useEffect(() => {
    let active = true
    const parse = async () => {
      try {
        if (!arrayBuffer) throw new Error('Missing Word content')
        const html = await renderDocxDocument(arrayBuffer)
        if (active) {
          setResult({ input: arrayBuffer, html })
          setZoom(null)
        }
      } catch {
        if (active) setResult({ input: arrayBuffer, failed: true })
      }
    }
    void parse()
    return () => {
      active = false
    }
  }, [arrayBuffer])

  useEffect(() => {
    if (!ready || !frame.current) return
    const element = frame.current
    const measure = () => {
      const doc = element.contentDocument
      if (!doc) return
      const pages = [
        ...doc.querySelectorAll<HTMLElement>('.docx-wrapper > section'),
      ]
      setLayout({
        width: Math.max(
          0,
          ...pages.map((page) => Math.max(page.offsetWidth, page.scrollWidth)),
        ),
        pages: pages.length,
        viewport: element.clientWidth,
      })
    }
    element.addEventListener('load', measure)
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => {
      element.removeEventListener('load', measure)
      observer.disconnect()
    }
  }, [ready, result.html])

  const applyFrameStyle = useCallback(() => {
    const doc = frame.current?.contentDocument
    if (!doc) return
    doc.documentElement.style.setProperty('--preview-zoom', String(scale / 100))
  }, [scale])
  useEffect(applyFrameStyle, [applyFrameStyle, result.html])

  if (failed)
    return (
      <ErrorState
        icon={<FileText className="size-icon-2xl" />}
        title={t('knowledge.preview.documentPreviewFailed')}
        message={t('knowledge.preview.errors.unreadable')}
        url={sourceUrl}
      />
    )
  if (!ready)
    return <LoadingState message={t('knowledge.preview.loadingDocument')} />

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background-surface">
      <div className="flex shrink-0 items-center justify-between gap-space-sm border-b border-border-default px-space-md py-space-xs">
        <span className="text-sm text-text-secondary" aria-live="polite">
          {t('knowledge.preview.pageCount', { count: layout.pages })}
        </span>
        <div className="flex items-center gap-space-xs">
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('common.documentImage.zoomOut')}
            disabled={scale <= 5}
            onClick={() => setZoom(stepDocxZoom(scale, -1))}
          >
            <ZoomOut className="size-icon-sm" />
          </Button>
          <span className="text-sm text-text-primary tabular-nums">
            {scale}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('common.documentImage.zoomIn')}
            disabled={scale >= 200}
            onClick={() => setZoom(stepDocxZoom(scale, 1))}
          >
            <ZoomIn className="size-icon-sm" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('knowledge.preview.fitWidth')}
            onClick={() => setZoom(null)}
          >
            <ScanLine className="size-icon-sm" />
          </Button>
        </div>
      </div>
      <iframe
        ref={frame}
        title={t('knowledge.preview.documentPreview')}
        sandbox="allow-same-origin"
        referrerPolicy="no-referrer"
        srcDoc={result.html}
        onLoad={applyFrameStyle}
        className="min-h-0 w-full flex-1 border-0 bg-background-subtle"
      />
    </div>
  )
}

export const DocxPreview = memo(DocxPreviewInner)
