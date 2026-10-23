import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'

export function SourceMetadata({
  items,
  onCopy,
}: {
  items: readonly { label: string; value: string; copyable?: boolean }[]
  onCopy?: () => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (value: string) => {
    try {
      await copyToClipboard(value)
      setCopied(value)
      toast.success(t('sources.copied'))
      onCopy?.()
    } catch {
      toast.error(t('sources.copyFailed'))
    }
  }
  return (
    <dl className="divide-y divide-border-subtle rounded-radius-lg border border-border-subtle bg-background-surface px-space-base">
      {items.map(({ label, value, copyable }) => (
        <div
          key={label}
          className="flex min-w-0 items-center gap-space-base py-space-base"
        >
          <div className="min-w-0 flex-1 space-y-space-xs">
            <dt className="text-xs text-text-secondary">{label}</dt>
            <dd
              className="truncate font-mono text-xs text-text-primary"
              title={value}
            >
              {value}
            </dd>
          </div>
          {copyable && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${t('sources.copy')} ${label}`}
              onClick={() => void copy(value)}
            >
              {copied === value ? (
                <Check className="size-icon-sm" />
              ) : (
                <Copy className="size-icon-sm" />
              )}
            </Button>
          )}
        </div>
      ))}
    </dl>
  )
}

export const sourcePlainText = (content: string) =>
  content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function SourceRelevance({
  value,
  label,
}: {
  value?: number
  label: string
}) {
  const { t, i18n } = useTranslation()
  const score =
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
      ? value
      : undefined
  const text =
    score === undefined
      ? t('sources.unavailable')
      : new Intl.NumberFormat(i18n.resolvedLanguage, {
          style: 'percent',
          maximumFractionDigits: 0,
        }).format(score)
  return (
    <div className="flex items-center justify-between gap-space-base border-b border-border-subtle py-space-sm text-sm">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium text-text-primary">{text}</dd>
    </div>
  )
}
