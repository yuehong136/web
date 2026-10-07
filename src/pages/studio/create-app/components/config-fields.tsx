import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { AppConfig } from '../types'

export type ConfigChange = <K extends keyof AppConfig>(
  key: K,
  value: AppConfig[K],
) => void
export interface ConfigBindings {
  config: AppConfig
  onChange: ConfigChange
}
interface NumericFieldProps {
  label: string
  hint?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  enabled?: boolean
  onEnabledChange?: (enabled: boolean) => void
  inputOnly?: boolean
}
export function NumericField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  enabled = true,
  onEnabledChange,
  inputOnly,
}: NumericFieldProps) {
  const id = useId()
  const { t } = useTranslation()
  return (
    <div className="space-y-space-sm">
      <div className="flex items-center justify-between gap-space-base">
        <Label htmlFor={id} className="min-w-0">
          {label}
        </Label>
        {onEnabledChange && (
          <Switch
            aria-label={label}
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        )}
      </div>
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-relaxed text-text-secondary"
        >
          {hint}
        </p>
      )}
      {enabled ? (
        <div className="flex items-center gap-space-base">
          {!inputOnly && (
            <Slider
              aria-label={label}
              min={min}
              max={max}
              step={step}
              value={[value]}
              onValueChange={([next]) => onChange(next)}
              className="min-w-0 flex-1"
            />
          )}
          <Input
            id={id}
            aria-describedby={hint ? `${id}-hint` : undefined}
            className="w-24 shrink-0 tabular-nums"
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => {
              const next = event.target.valueAsNumber
              if (Number.isFinite(next))
                onChange(Math.min(max, Math.max(min, next)))
            }}
          />
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          {t('studio.editor.modelDefault')}
        </p>
      )}
    </div>
  )
}
export function ToggleField({
  field,
  config,
  onChange,
}: ConfigBindings & {
  field:
    | 'keyword'
    | 'tts'
    | 'toc_enhance'
    | 'refine_multiturn'
    | 'use_kg'
    | 'reasoning'
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-space-base py-space-sm">
      <Label htmlFor={id}>{t(`studio.editor.${field}`)}</Label>
      <Switch
        id={id}
        checked={config.prompt_config[field]}
        onCheckedChange={(checked) =>
          onChange('prompt_config', {
            ...config.prompt_config,
            [field]: checked,
          })
        }
      />
    </div>
  )
}
