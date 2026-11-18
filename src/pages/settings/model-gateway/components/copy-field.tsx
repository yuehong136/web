import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { cn } from '@/lib/utils'
import { PREFIX } from '../utils'

interface CopyFieldProps {
  value: string
  /** Accessible name of the copy button, e.g. "Copy base URL". */
  copyLabel: string
  /** Highlights a value the reader must take now (a one-time key). */
  emphasis?: boolean
  className?: string
  'data-testid'?: string
}

/** A one-line monospace value with a copy button. */
export function CopyField({
  value,
  copyLabel,
  emphasis = false,
  className,
  'data-testid': testId,
}: CopyFieldProps) {
  const { t } = useTranslation()
  const { copiedStates, copyWithFeedback } = useCopyFeedback()
  const copied = Boolean(copiedStates.value)
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-space-sm rounded-radius-md border py-space-2xs pr-space-2xs pl-space-sm',
        emphasis
          ? 'border-info-line bg-info-soft'
          : 'border-line-subtle bg-sunken',
        className,
      )}
    >
      <code
        className="min-w-0 flex-1 truncate font-mono text-sm text-fg"
        title={value}
        data-testid={testId}
      >
        {value}
      </code>
      <Button
        type="button"
        size="sm"
        variant={emphasis ? 'default' : 'outline'}
        aria-label={copyLabel}
        leftIcon={
          copied ? (
            <Check className="size-icon-sm" aria-hidden="true" />
          ) : (
            <Copy className="size-icon-sm" aria-hidden="true" />
          )
        }
        onClick={() => void copyWithFeedback(value, 'value')}
      >
        {t(copied ? `${PREFIX}.common.copied` : `${PREFIX}.common.copy`)}
      </Button>
    </div>
  )
}
