import { Search } from 'lucide-react'
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

function stringifyPreview(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '未记录'
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
  const items = [
    ...collectInsightItems(span?.input),
    ...collectInsightItems(span?.output),
  ].slice(0, 12)

  return (
    <div className="gap-space-base p-space-lg grid xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-radius-md bg-surface-primary min-h-0 overflow-hidden">
        <div className="gap-space-xs px-space-base py-space-sm flex items-center border-b border-border-subtle">
          <Search className="size-3.5 text-text-tertiary" />
          <h5 className="text-sm font-semibold text-text-primary">关键字段</h5>
        </div>
        {items.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {items.map((item) => (
              <div key={item.path} className="p-space-base">
                <div className="gap-space-xs flex min-w-0 items-center">
                  <span className="text-xs font-medium text-text-tertiary">
                    {item.label}
                  </span>
                  <span className="text-text-caption truncate font-mono text-xs">
                    {item.path}
                  </span>
                </div>
                <pre
                  className={cn(
                    'mt-space-xs max-h-[180px] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-text-primary',
                    typeof item.value === 'string' ? 'font-sans' : 'font-mono',
                  )}
                >
                  {stringifyPreview(item.value)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-space-base py-space-xl text-center text-sm text-text-tertiary">
            当前节点没有可自动提取的 Prompt、Query 或 Context 字段。
          </div>
        )}
      </section>
      <TraceJsonViewer
        title="上下文源码"
        value={{ input: span?.input, output: span?.output }}
        emptyLabel="未记录上下文"
        height={420}
        dedupeArrays
      />
    </div>
  )
}
