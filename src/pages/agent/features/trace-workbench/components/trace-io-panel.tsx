import { FileInput, FileOutput } from 'lucide-react'
import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'

function formatPayload(value: unknown, emptyLabel: string) {
  if (value === undefined || value === null || value === '') {
    return emptyLabel
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

function PayloadBlock({
  title,
  value,
  icon: Icon,
  emptyLabel,
}: {
  title: string
  value: unknown
  icon: typeof FileInput
  emptyLabel: string
}) {
  return (
    <section className="rounded-radius-md bg-surface-primary min-h-0 border border-border-subtle">
      <div className="gap-space-xs px-space-base py-space-sm flex items-center border-b border-border-subtle">
        <Icon className="size-4 text-text-tertiary" />
        <h5 className="text-sm font-semibold text-text-primary">{title}</h5>
      </div>
      <pre className="p-space-base max-h-[260px] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-text-secondary">
        {formatPayload(value, emptyLabel)}
      </pre>
    </section>
  )
}

export function TraceIoPanel({ span }: { span?: TraceSpanViewModel }) {
  return (
    <div className="gap-space-base p-space-lg grid lg:grid-cols-2">
      <PayloadBlock
        icon={FileInput}
        title="Input"
        value={span?.input}
        emptyLabel="未记录输入"
      />
      <PayloadBlock
        icon={FileOutput}
        title="Output"
        value={span?.output}
        emptyLabel="未记录输出"
      />
    </div>
  )
}
