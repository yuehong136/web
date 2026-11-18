import type { TFunction } from 'i18next'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import { cn } from '@/lib/utils'
import { TraceJsonViewer } from './trace-json-viewer'

const IMPORTANT_KEY_PATTERN =
  /(^|\.)(query|question|prompt|system|instruction|context|content|message|answer|output|result)$/i

interface InsightItem {
  path: string
  label: string
  value: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringifyPreview(value: unknown, t: TFunction) {
  if (value === undefined || value === null || value === '') {
    return t('agent.traceWorkbench.notRecorded')
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function collectInsightItems(
  value: unknown,
  prefix = '',
  depth = 0,
): InsightItem[] {
  if (depth > 5) {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectInsightItems(item, `${prefix}[${index}]`, depth + 1),
    )
  }

  if (!isRecord(value)) {
    return []
  }

  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key
    const matched = IMPORTANT_KEY_PATTERN.test(path)
    const children =
      isRecord(item) || Array.isArray(item)
        ? collectInsightItems(item, path, depth + 1)
        : []

    if (!matched) {
      return children
    }

    return [
      {
        path,
        label: key,
        value: item,
      },
      ...children,
    ]
  })
}

export function TraceInsightPanel({ span }: { span?: TraceSpanViewModel }) {
  const { t } = useTranslation()
  const items = [
    ...collectInsightItems(span?.input),
    ...collectInsightItems(span?.output),
  ].slice(0, 12)

  return (
    <div className="grid gap-space-base p-space-lg xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="min-h-0 overflow-hidden rounded-radius-md bg-surface">
        <div className="flex items-center gap-space-xs border-b border-line-subtle px-space-base py-space-sm">
          <Search className="size-3.5 text-fg-subtle" />
          <h5 className="text-sm font-semibold text-fg">
            {t('agent.traceWorkbench.insight.keyFields')}
          </h5>
        </div>
        {items.length > 0 ? (
          <div className="divide-y divide-line-subtle">
            {items.map((item) => (
              <div key={item.path} className="p-space-base">
                <div className="flex min-w-0 items-center gap-space-xs">
                  <span className="text-xs font-medium text-fg-subtle">
                    {item.label}
                  </span>
                  <span className="truncate font-mono text-xs text-fg-subtle">
                    {item.path}
                  </span>
                </div>
                <pre
                  className={cn(
                    'mt-space-xs max-h-[180px] overflow-auto text-xs leading-relaxed break-words whitespace-pre-wrap text-fg',
                    typeof item.value === 'string' ? 'font-sans' : 'font-mono',
                  )}
                >
                  {stringifyPreview(item.value, t)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-space-base py-space-xl text-center text-sm text-fg-subtle">
            {t('agent.traceWorkbench.insight.empty')}
          </div>
        )}
      </section>
      <TraceJsonViewer
        title={t('agent.traceWorkbench.insight.contextSource')}
        value={{ input: span?.input, output: span?.output }}
        emptyLabel={t('agent.traceWorkbench.insight.contextEmpty')}
        height={420}
        dedupeArrays
      />
    </div>
  )
}
