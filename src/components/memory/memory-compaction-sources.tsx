import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { parseMemorySourceIds } from '@/lib/memory-source-ids'

export function MemoryCompactionSources({
  value,
  maximum,
  disabled,
  onChange,
}: {
  value: string
  maximum: number
  disabled: boolean
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  let ordered: string[] = []
  let invalid = false
  if (value.trim()) {
    try {
      ordered = parseMemorySourceIds(value, maximum)
    } catch {
      invalid = true
    }
  }
  return (
    <div className="min-w-0 space-y-space-sm">
      <Label htmlFor="compaction-source-order">
        {t('memory.compaction.sources')}
      </Label>
      <Textarea
        id="compaction-source-order"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby="compaction-order-boundary"
        className="font-mono"
      />
      <p id="compaction-order-boundary" className="text-xs text-fg-muted">
        {t('memory.compaction.orderBoundary', { count: maximum })}
      </p>
      {invalid && (
        <p role="alert" className="text-sm text-danger-fg">
          {t('memory.compaction.invalidSources', { count: maximum })}
        </p>
      )}
      {!!ordered.length && (
        <ol className="min-w-0 list-inside list-decimal space-y-space-xs text-xs">
          {ordered.map((id) => (
            <li key={id} className="font-mono break-all">
              {id}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
