import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  renderDocxDocument,
  stepDocxZoom,
} from '@/components/knowledge/document-preview/components/docx-document'
import { cn } from '@/lib/utils'

interface FilledDocxPreviewProps {
  /** Base64 `.docx` content, as returned by the auto-fill endpoints. */
  fileData: string | null
  className?: string
}

const toArrayBuffer = (base64: string) =>
  Uint8Array.from(atob(base64.trim()), (char) => char.charCodeAt(0)).buffer

interface RenderResult {
  input?: string
  html?: string
  failed?: boolean
}

/**
 * Word preview for the auto-fill steps. The document is rendered offscreen,
 * sanitised and shown in a script-free sandboxed frame (the same renderer as
 * knowledge previews), so filled values never enter the app DOM.
 */
export const FilledDocxPreview = ({
  fileData,
  className,
}: FilledDocxPreviewProps) => {
  const { t } = useTranslation()
  const frame = useRef<HTMLIFrameElement>(null)
  const [result, setResult] = useState<RenderResult>({})
  const [zoom, setZoom] = useState(100)
  const ready = Boolean(fileData) && result.input === fileData && result.html
  const failed = Boolean(fileData) && result.input === fileData && result.failed

  useEffect(() => {
    if (!fileData) return
    let active = true
    const render = async () => {
      try {
        const html = await renderDocxDocument(toArrayBuffer(fileData))
        if (active) setResult({ input: fileData, html })
      } catch {
        if (active) setResult({ input: fileData, failed: true })
      }
    }
    void render()
    return () => {
      active = false
    }
  }, [fileData])

  const applyZoom = useCallback(() => {
    frame.current?.contentDocument?.documentElement.style.setProperty(
      '--preview-zoom',
      String(zoom / 100),
    )
  }, [zoom])
  useEffect(applyZoom, [applyZoom, result.html])

  if (!fileData)
    return (
      <div
        className={cn(
          'flex h-full flex-col items-center justify-center gap-space-xs p-space-lg text-center',
          className,
        )}
      >
        <FileKindTile name="docx" size="lg" className="mb-space-xs" />
        <p className="text-sm text-fg-muted">
          {t('aiTools.autoFill.preview.empty')}
        </p>
        <p className="text-xs text-fg-subtle">
          {t('aiTools.autoFill.preview.emptyHint')}
        </p>
      </div>
    )

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="flex min-h-[var(--control-height)] shrink-0 items-center justify-between gap-space-sm border-b border-line-subtle px-space-md">
        <span className="text-sm text-fg-muted">
          {t('aiTools.autoFill.preview.title')}
        </span>
        <div className="flex items-center gap-space-2xs">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('aiTools.autoFill.preview.zoomOut')}
            disabled={!ready || zoom <= 5}
            onClick={() => setZoom((value) => stepDocxZoom(value, -1))}
          >
            <ZoomOut aria-hidden="true" />
          </Button>
          <span className="min-w-12 text-center text-xs text-fg-muted tabular-nums">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('aiTools.autoFill.preview.zoomIn')}
            disabled={!ready || zoom >= 200}
            onClick={() => setZoom((value) => stepDocxZoom(value, 1))}
          >
            <ZoomIn aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('aiTools.autoFill.preview.resetZoom')}
            disabled={!ready || zoom === 100}
            onClick={() => setZoom(100)}
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        </div>
      </div>
      {failed ? (
        <p
          role="alert"
          className="flex flex-1 items-center justify-center p-space-lg text-sm text-danger-fg"
        >
          {t('aiTools.autoFill.preview.renderFailed')}
        </p>
      ) : ready ? (
        <iframe
          ref={frame}
          title={t('aiTools.autoFill.preview.title')}
          sandbox="allow-same-origin"
          referrerPolicy="no-referrer"
          srcDoc={result.html}
          onLoad={applyZoom}
          className="min-h-0 w-full flex-1 border-0 bg-sunken"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Spinner label={t('aiTools.autoFill.preview.rendering')} stacked />
        </div>
      )}
    </div>
  )
}
