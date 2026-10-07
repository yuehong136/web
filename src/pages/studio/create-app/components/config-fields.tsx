import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TooltipProvider,
  TooltipRoot,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
    <div className="space-y-space-sm py-space-xs">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex min-w-0 items-center gap-space-xs">
          <Label htmlFor={enabled ? id : `${id}-enabled`} className="min-w-0">
            {label}
          </Label>
          {hint && (
            <TooltipProvider>
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-text-tertiary"
                    aria-label={t('studio.editor.parameterHelp', {
                      name: label,
                    })}
                  >
                    <CircleHelp className="size-icon-sm" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-72">{hint}</TooltipContent>
              </TooltipRoot>
            </TooltipProvider>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-space-sm">
          {enabled ? (
            <Input
              id={id}
              aria-describedby={hint ? `${id}-hint` : undefined}
              className="h-8 w-20 shrink-0 tabular-nums"
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
          ) : (
            <span className="text-xs text-text-secondary">
              {t('studio.editor.modelDefault')}
            </span>
          )}
          {onEnabledChange && (
            <Switch
              id={`${id}-enabled`}
              aria-label={label}
              checked={enabled}
              onCheckedChange={onEnabledChange}
            />
          )}
        </div>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="sr-only">
          {hint}
        </p>
      )}
      {enabled && !inputOnly && (
        <Slider
          aria-label={label}
          aria-describedby={hint ? `${id}-hint` : undefined}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([next]) => onChange(next)}
          className="min-w-0"
        />
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
