import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { cn } from '@/lib/utils'
import { PREFIX } from '../utils'

export interface CodeSample {
  id: string
  label: string
  code: string
  /** A line under the code, e.g. which tools read the variables. */
  note?: ReactNode
}

interface CodeSamplesProps {
  samples: CodeSample[]
  /** Accessible name of the language switch. */
  label: string
  copyLabel: string
  className?: string
}

/** Switchable code snippets with one copy button for the shown one. */
export function CodeSamples({
  samples,
  label,
  copyLabel,
  className,
}: CodeSamplesProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(samples[0]?.id ?? '')
  const { copiedStates, copyWithFeedback } = useCopyFeedback()
  const sample = samples.find((item) => item.id === selected) ?? samples[0]
  if (!sample) return null
  const copied = Boolean(copiedStates[sample.id])
  return (
    <div className={cn('flex min-w-0 flex-col gap-space-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <SegmentedControl
          size="sm"
          aria-label={label}
          value={sample.id}
          onValueChange={setSelected}
          options={samples.map((item) => ({
            value: item.id,
            label: item.label,
          }))}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={copyLabel}
          leftIcon={
            copied ? (
              <Check className="size-icon-sm" aria-hidden="true" />
            ) : (
              <Copy className="size-icon-sm" aria-hidden="true" />
            )
          }
          onClick={() => void copyWithFeedback(sample.code, sample.id)}
        >
          {t(copied ? `${PREFIX}.common.copied` : `${PREFIX}.common.copy`)}
        </Button>
      </div>
      <pre
        className="min-w-0 overflow-x-auto rounded-radius-md bg-background-subtle p-space-md font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-text-primary"
        data-testid={`code-sample-${sample.id}`}
      >
        {sample.code}
      </pre>
      {sample.note ? (
        <p className="text-xs text-text-tertiary">{sample.note}</p>
      ) : null}
    </div>
  )
}
