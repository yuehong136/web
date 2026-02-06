import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { LLMSelectField } from './llm-select-field'

type LlmSettingProps = {
  hideModel?: boolean
}

export function LlmSetting({ hideModel = false }: LlmSettingProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <div className="space-y-4">
      {!hideModel && <LLMSelectField type="chat" />}

      <FormField
        control={form.control}
        name="temperature"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>{t('flow.temperature', 'Temperature')}</FormLabel>
              <span className="text-xs text-text-secondary">
                {field.value ?? 0.1}
              </span>
            </div>
            <FormControl>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[field.value ?? 0.1]}
                onValueChange={([v]) => field.onChange(v)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="top_p"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>{t('flow.topP', 'Top P')}</FormLabel>
              <span className="text-xs text-text-secondary">
                {field.value ?? 0.3}
              </span>
            </div>
            <FormControl>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[field.value ?? 0.3]}
                onValueChange={([v]) => field.onChange(v)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="presence_penalty"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                {t('flow.presencePenalty', 'Presence Penalty')}
              </FormLabel>
              <span className="text-xs text-text-secondary">
                {field.value ?? 0.4}
              </span>
            </div>
            <FormControl>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[field.value ?? 0.4]}
                onValueChange={([v]) => field.onChange(v)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="frequency_penalty"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                {t('flow.frequencyPenalty', 'Frequency Penalty')}
              </FormLabel>
              <span className="text-xs text-text-secondary">
                {field.value ?? 0.7}
              </span>
            </div>
            <FormControl>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[field.value ?? 0.7]}
                onValueChange={([v]) => field.onChange(v)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="max_tokens"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.maxTokens', 'Max Tokens')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                {...field}
                value={field.value ?? 512}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
