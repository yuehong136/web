import {
  Check,
  Copy,
  ListCollapse,
  ListTree,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { cn, copyToClipboard } from '@/lib/utils'
import { formatTracePayload } from '../utils'

const COLLAPSED_LINE_LIMIT = 80

interface DisplayLine {
  number?: number
  text: string
}
interface TraceJsonViewerProps {
  title: string
  value: unknown
  emptyLabel?: string
  icon?: LucideIcon
  height?: number | string
  className?: string
  dedupeArrays?: boolean
}

function resolvePanelHeight(height?: number | string) {
  if (height === undefined) {
    return undefined
  }

  return typeof height === 'number' ? `${height}px` : height
}

function buildVisibleLines(lines: string[], collapsed: boolean): DisplayLine[] {
  if (!collapsed || lines.length <= COLLAPSED_LINE_LIMIT) {
    return lines.map((line, index) => ({
      number: index + 1,
      text: line,
    }))
  }

  const headCount = Math.floor(COLLAPSED_LINE_LIMIT * 0.7)
  const tailCount = COLLAPSED_LINE_LIMIT - headCount
  return [
    ...lines.slice(0, headCount).map((line, index) => ({
      number: index + 1,
      text: line,
    })),
    {
      text: `... 已折叠 ${lines.length - COLLAPSED_LINE_LIMIT} 行 ...`,
    },
    ...lines.slice(-tailCount).map((line, index) => ({
      number: lines.length - tailCount + index + 1,
      text: line,
    })),
  ]
}

export function TraceJsonViewer({
  title,
  value,
  emptyLabel,
  icon: Icon,
  height,
  className,
  dedupeArrays = false,
}: TraceJsonViewerProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const payload = useMemo(
    () => formatTracePayload(value, emptyLabel, { dedupeArrays }),
    [dedupeArrays, emptyLabel, value],
  )
  const lines = useMemo(() => payload.text.split('\n'), [payload.text])
  const visibleLines = useMemo(
    () => buildVisibleLines(lines, collapsed),
    [collapsed, lines],
  )
  const canCollapse = lines.length > COLLAPSED_LINE_LIMIT
  const panelHeight = resolvePanelHeight(height)

  const handleCopy = async () => {
    try {
      await copyToClipboard(payload.text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
      toast.error(t('common.copyFailed', '复制失败'))
    }
  }

  return (
    <section
      className={cn(
        'rounded-radius-md bg-surface-primary min-h-0 overflow-hidden border border-border-subtle',
        className,
      )}
    >
      <div className="gap-space-xs px-space-base py-space-xs flex min-h-10 items-center border-b border-border-subtle">
        {Icon ? <Icon className="size-3.5 text-text-tertiary" /> : null}
        <h5 className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
          {title}
        </h5>
        <span className="rounded-radius-full bg-surface-secondary px-space-xs text-text-caption py-[1px] font-mono text-[11px] uppercase">
          {payload.language}
        </span>
        {canCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7"
            aria-label={collapsed ? `展开${title}` : `折叠${title}`}
            onClick={() => setCollapsed((previous) => !previous)}
          >
            {collapsed ? (
              <ListTree className="size-3.5" />
            ) : (
              <ListCollapse className="size-3.5" />
            )}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7"
          aria-label={`复制${title}`}
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3.5 text-status-success" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
      <div
        className="overflow-auto overscroll-contain"
        style={{
          height: panelHeight,
          maxHeight: panelHeight,
        }}
      >
        <pre className="grid grid-cols-[auto_minmax(0,1fr)] text-xs leading-6">
          {visibleLines.map((line, index) => (
            <span key={`${index}-${line.text}`} className="contents">
              <span className="bg-surface-secondary px-space-sm text-text-caption select-none border-r border-border-subtle text-right font-mono">
                {line.number || ''}
              </span>
              <code className="px-space-base whitespace-pre-wrap break-words font-mono text-text-secondary">
                {line.text || ' '}
              </code>
            </span>
          ))}
        </pre>
      </div>
    </section>
  )
}
