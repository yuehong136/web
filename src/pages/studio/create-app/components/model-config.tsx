import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GenerationPresetType } from '@/constants/llm'
import { SLIDER_PRESETS } from '@/components/ui/slider-with-input.constants'
import type { MyLLMProvider } from '@/stores/model'
import type { AppLLMSetting } from '../types'
import { CenterConfigSection } from './center-config-section'
import { NumericField, ToggleField, type ConfigBindings } from './config-fields'

export interface ModelConfigProps extends ConfigBindings {
  models: MyLLMProvider
  loading: boolean
  error?: string
  preset: GenerationPresetType
  onPresetChange: (preset: GenerationPresetType) => void
  onSettingChange: <K extends keyof AppLLMSetting>(
    key: K,
    value: AppLLMSetting[K],
  ) => void
}
const fields = [
  ['temperature', 'temperature'],
  ['top_p', 'topP'],
  ['presence_penalty', 'presencePenalty'],
  ['frequency_penalty', 'frequencyPenalty'],
  ['max_tokens', 'maxTokens'],
] as const
export function ModelConfig({
  config,
  onChange,
  models,
  loading,
  error,
  preset,
  onPresetChange,
  onSettingChange,
}: ModelConfigProps) {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  const count = fields.filter(
    ([field]) => config.llm_setting[`${field}_enabled`],
  ).length
  return (
    <div className="mx-auto w-full max-w-3xl space-y-space-xl p-space-lg">
      <div className="space-y-space-sm">
        <h2 className="text-base font-semibold text-text-primary">
          {t('studio.editor.modelChoice')}
        </h2>
        <ChatModelSelector
          variant="compact"
          models={models}
          selectedModelName={config.llm_id}
          loading={loading}
          error={error}
          onSelect={(name) => {
            if (name) onChange('llm_id', name)
          }}
        />
      </div>
      <fieldset className="space-y-space-sm">
        <legend className="mb-space-sm text-sm font-medium text-text-primary">
          {t('studio.editor.generationStyle')}
        </legend>
        <RadioGroup
          value={preset}
          aria-label={t('studio.editor.generationStyle')}
          onValueChange={(value) => {
            onPresetChange(value as GenerationPresetType)
            if (value === GenerationPresetType.Custom) setOpen(true)
          }}
          className="grid-cols-2 gap-space-sm"
        >
          {[
            GenerationPresetType.Improvise,
            GenerationPresetType.Precise,
            GenerationPresetType.Balance,
            GenerationPresetType.Custom,
          ].map((value) => (
            <Label
              key={value}
              htmlFor={`${id}-${value}`}
              className={`flex cursor-pointer items-center gap-space-sm rounded-radius-md border border-border-default px-space-base py-space-sm ${preset === value ? 'bg-state-selected-bg text-state-selected-text' : 'text-text-secondary'}`}
            >
              <RadioGroupItem id={`${id}-${value}`} value={value} />
              {t(`studio.editor.${value}`)}
            </Label>
          ))}
        </RadioGroup>
        <p className="text-xs leading-relaxed text-text-secondary">
          {t('studio.editor.generationHint')}
        </p>
      </fieldset>
      <p className="text-sm text-text-secondary">
        {count
          ? t('studio.editor.overrides', { count })
          : t('studio.editor.modelDefault')}
      </p>
      <CenterConfigSection
        title={t('studio.editor.parameters')}
        open={open}
        onOpenChange={setOpen}
      >
        {fields.map(([field, presetKey]) => {
          const definition = SLIDER_PRESETS[presetKey]
          return (
            <NumericField
              key={field}
              label={t(`studio.editor.${field}`)}
              hint={t(`studio.editor.${field}Hint`)}
              value={config.llm_setting[field] ?? definition.default}
              onChange={(value) => onSettingChange(field, value)}
              min={definition.min}
              max={definition.max}
              step={definition.step}
              inputOnly={field === 'max_tokens'}
              enabled={config.llm_setting[`${field}_enabled`] ?? false}
              onEnabledChange={(enabled) =>
                onSettingChange(`${field}_enabled`, enabled)
              }
            />
          )
        })}
      </CenterConfigSection>
      <ToggleField field="reasoning" config={config} onChange={onChange} />
    </div>
  )
}
