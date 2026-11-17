import { useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Config as PurifyConfig } from 'dompurify'
import { Copy, Download, Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import { CodeBlock } from '@/components/chat/CodeBlock'
import { Button } from '@/components/ui/button'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { SafeHtml } from '@/components/ui/safe-html'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip } from '@/components/ui/tooltip'

/** Mermaid's own settings for one diagram (theme, security level…). */
export type MermaidConfig = Record<string, unknown>

// Mermaid writes SVG with HTML labels in foreignObject and an inline style.
const SVG_PROFILE: PurifyConfig = {
  USE_PROFILES: { svg: true, svgFilters: true, html: true },
  ADD_TAGS: ['foreignObject', 'style'],
  HTML_INTEGRATION_POINTS: { foreignobject: true },
}
const ZOOM_STEP = 0.2
const ZOOM_MIN = 0.4
const ZOOM_MAX = 3
/** While an answer streams, wait for the source to settle a little. */
const STREAM_RENDER_DELAY_MS = 300

type View = 'diagram' | 'code'

let renderQueue: Promise<unknown> = Promise.resolve()

/**
 * Mermaid renders one diagram at a time (it keeps global state while it
 * lays out), so renders queue up; each gets the config it asked for.
 */
async function renderDiagram(id: string, code: string, config: MermaidConfig) {
  const run = renderQueue.then(async () => {
    const mermaid = (await import('mermaid')).default
    mermaid.initialize({ startOnLoad: false, ...config })
    const { svg } = await mermaid.render(id, code)
    return svg
  })
  renderQueue = run.catch(() => undefined)
  return run
}

/**
 * A Mermaid diagram in an answer: the picture, or its source highlighted by
 * the same Shiki code block as every other fence. Zoom with the buttons and
 * drag to pan; download the SVG or copy the source. While the answer is
 * still streaming, the last diagram that rendered stays up.
 */
export function MermaidDiagram({
  code,
  config,
  streaming = false,
}: {
  code: string
  config: MermaidConfig
  streaming?: boolean
}) {
  const { t } = useTranslation()
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [view, setView] = useState<View>('diagram')
  const [result, setResult] = useState<{
    key: string
    svg?: string
    failed?: boolean
  } | null>(null)
  const [lastGood, setLastGood] = useState<string>()
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const key = `${JSON.stringify(config)}\n${code}`

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(
      () => {
        renderDiagram(id, code, config).then(
          (svg) => {
            if (cancelled) return
            setResult({ key, svg })
            setLastGood(svg)
          },
          () => {
            if (!cancelled) setResult({ key, failed: true })
          },
        )
      },
      streaming ? STREAM_RENDER_DELAY_MS : 0,
    )
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // `key` covers code and config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, key, streaming])

  const current = result?.key === key ? result : null
  const svg = current?.svg ?? (streaming ? lastGood : undefined)
  if (current?.failed && !streaming)
    return <CodeBlock code={code} language="mermaid" />

  const download = () => {
    if (!svg) return
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'diagram.svg'
    link.click()
    URL.revokeObjectURL(url)
  }
  const zoomBy = (step: number) =>
    setZoom((value) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((value + step).toFixed(2)))),
    )
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    drag.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setPan({
      x: event.clientX - drag.current.x,
      y: event.clientY - drag.current.y,
    })
  }

  return (
    <figure className="mermaid-diagram" data-mermaid-diagram>
      <figcaption className="mermaid-diagram-toolbar">
        <SegmentedControl<View>
          size="sm"
          aria-label={t('chat.diagram.view')}
          value={view}
          onValueChange={setView}
          options={[
            { value: 'diagram', label: t('chat.diagram.picture') },
            { value: 'code', label: t('chat.diagram.source') },
          ]}
        />
        {view === 'diagram' && (
          <span className="ms-auto flex items-center gap-space-2xs">
            <ToolbarButton
              label={t('common.copy')}
              onClick={() =>
                void copyToClipboardWithFeedback(
                  code,
                  t('common.copied'),
                  t('common.copyFailed'),
                )
              }
            >
              <Copy aria-hidden="true" className="size-icon-sm" />
            </ToolbarButton>
            <ToolbarButton
              label={t('chat.diagram.zoomOut')}
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={zoom <= ZOOM_MIN}
            >
              <ZoomOut aria-hidden="true" className="size-icon-sm" />
            </ToolbarButton>
            <ToolbarButton
              label={t('chat.diagram.zoomIn')}
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={zoom >= ZOOM_MAX}
            >
              <ZoomIn aria-hidden="true" className="size-icon-sm" />
            </ToolbarButton>
            <ToolbarButton
              label={t('chat.diagram.reset')}
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
            >
              <Maximize aria-hidden="true" className="size-icon-sm" />
            </ToolbarButton>
            <ToolbarButton
              label={t('chat.diagram.download')}
              onClick={download}
              disabled={!svg}
            >
              <Download aria-hidden="true" className="size-icon-sm" />
            </ToolbarButton>
          </span>
        )}
      </figcaption>
      {view === 'code' ? (
        <CodeBlock code={code} language="mermaid" />
      ) : svg ? (
        <div
          className="mermaid-diagram-stage"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={() => {
            drag.current = null
          }}
          onPointerCancel={() => {
            drag.current = null
          }}
        >
          {/* Inline SVG, not <img>: text stays selectable and themed. */}
          {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
          <SafeHtml
            html={svg}
            options={SVG_PROFILE}
            role="img"
            aria-label={t('chat.diagram.picture')}
            className="mermaid-diagram-canvas"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          />
        </div>
      ) : (
        <div className="mermaid-diagram-stage grid place-items-center">
          <Spinner size="sm" />
        </div>
      )}
    </figure>
  )
}

function ToolbarButton({
  label,
  ...props
}: Parameters<typeof Button>[0] & { label: string }) {
  return (
    <Tooltip content={label} asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        {...props}
      />
    </Tooltip>
  )
}
