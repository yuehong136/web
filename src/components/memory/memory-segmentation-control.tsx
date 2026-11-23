import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MemorySourceSegmentation } from '@/types/memory-segments'
import type { MemorySegmentControlLimits } from '@/lib/memory-segments'

export function MemorySegmentationControl({
  value,
  supported,
  limits,
  disabled,
  onChange,
}: {
  value?: MemorySourceSegmentation
  supported: boolean
  limits: MemorySegmentControlLimits
  disabled: boolean
  onChange: (value: MemorySourceSegmentation | undefined) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const segmented = value?.mode === 'segmented'
  if (!supported && !segmented) return null
  return (
    <div className="space-y-space-sm rounded-radius-lg border border-border-default p-space-base">
      <div className="flex items-center gap-space-sm">
        <Checkbox
          id={id}
          checked={segmented}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChange(
              checked === true
                ? {
                    mode: 'segmented',
                    fragment_token_limit: Math.min(2048, limits.maxTokens),
                    max_parts_per_source: Math.min(32, limits.maxParts),
                  }
                : undefined,
            )
          }
        />
        <Label htmlFor={id}>{t('memory.segments.enable')}</Label>
      </div>
      <p className="text-xs text-text-secondary">
        {t('memory.segments.selectionHint')}
      </p>
      {!supported && (
        <Alert variant="warning">{t('memory.segments.unavailable')}</Alert>
      )}
      {segmented && (
        <div className="grid gap-space-base sm:grid-cols-2">
          {(
            [
              [
                'fragment_token_limit',
                'fragmentBudget',
                limits.minTokens,
                limits.maxTokens,
              ],
              ['max_parts_per_source', 'maxParts', 1, limits.maxParts],
            ] as const
          ).map(([field, label, min, max]) => {
            const valid =
              Number.isInteger(value[field]) &&
              value[field] >= min &&
              value[field] <= max
            return (
              <div key={field} className="space-y-space-xs">
                <Label htmlFor={`${id}-${field}`}>
                  {t(`memory.segments.${label}`)}
                </Label>
                <Input
                  id={`${id}-${field}`}
                  type="number"
                  min={min}
                  max={max}
                  step={1}
                  disabled={disabled || !supported}
                  value={Number.isNaN(value[field]) ? '' : value[field]}
                  aria-invalid={!valid}
                  onChange={(event) =>
                    onChange({ ...value, [field]: event.target.valueAsNumber })
                  }
                />
                {!valid && (
                  <p role="alert" className="text-xs text-status-error">
                    {t('memory.incremental.invalidNumber', { min, max })}
                  </p>
                )}
              </div>
            )
          })}
          <p className="text-xs text-text-secondary sm:col-span-2">
            {t('memory.segments.fragmentBudgetHint')}
          </p>
        </div>
      )}
    </div>
  )
}
