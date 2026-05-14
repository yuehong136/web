'use client'

import { useTranslation } from 'react-i18next'
import { useFormContext, useWatch } from 'react-hook-form'
import { Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SliderInputFormField } from './SliderInputFormField'
import {
  DefaultRaptorPrompt as LEGACY_DEFAULT_RAPTOR_PROMPT,
  RaptorScopeOptions,
} from '@/types/knowledge-form'

interface RaptorFormFieldsProps {
  className?: string
}

export function RaptorFormFields({ className }: RaptorFormFieldsProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  const useRaptor = useWatch({
    control: form.control,
    name: 'parser_config.raptor.use_raptor',
    defaultValue: false,
  })

  // 生成随机种子
  const handleGenerateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 10000)
    form.setValue('parser_config.raptor.random_seed', randomSeed)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 启用 RAPTOR */}
      <FormField
        control={form.control}
        name="parser_config.raptor.use_raptor"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip={t('knowledge.settings.raptor.enableTooltip')}
              className="w-1/4 shrink-0 text-sm text-text-secondary"
            >
              {t('knowledge.settings.raptor.enable')}
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
          </FormItem>
        )}
      />

      {/* 生成范围 */}
      <FormField
        control={form.control}
        name="parser_config.raptor.scope"
        render={({ field }) => (
          <FormItem className="flex items-start gap-1 space-y-0">
            <FormLabel
              tooltip={t('knowledge.settings.raptor.scopeTooltip')}
              className="w-1/4 shrink-0 pt-2 text-sm text-text-secondary"
            >
              {t('knowledge.settings.raptor.scope')}
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  {RaptorScopeOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <RadioGroupItem value={opt.value} />
                      <span className="text-sm text-text-secondary">
                        {t(
                          `knowledge.settings.options.raptorScope.${opt.value}`,
                        )}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </div>
          </FormItem>
        )}
      />

      {useRaptor && (
        <>
          {/* 提示词 */}
          <FormField
            control={form.control}
            name="parser_config.raptor.prompt"
            render={({ field }) => (
              <FormItem className="flex items-start gap-1 space-y-0">
                <FormLabel
                  tooltip={t('knowledge.settings.raptor.promptTooltip')}
                  className="w-1/4 shrink-0 pt-2 text-sm text-text-secondary"
                >
                  {t('knowledge.settings.raptor.prompt')}
                </FormLabel>
                <div className="w-3/4">
                  <FormControl>
                    <Textarea
                      {...field}
                      value={
                        !field.value ||
                        field.value === LEGACY_DEFAULT_RAPTOR_PROMPT
                          ? t('knowledge.settings.raptor.defaultPrompt')
                          : field.value
                      }
                      placeholder={t(
                        'knowledge.settings.raptor.promptPlaceholder',
                      )}
                      rows={6}
                      className="resize-none font-mono text-xs"
                    />
                  </FormControl>
                  <FormMessage className="mt-1" />
                </div>
              </FormItem>
            )}
          />

          {/* 最大 Token */}
          <SliderInputFormField
            name="parser_config.raptor.max_token"
            label={t('knowledge.settings.raptor.maxToken')}
            tooltip={t('knowledge.settings.raptor.maxTokenTooltip')}
            min={0}
            max={2048}
            step={1}
            defaultValue={256}
            layout="horizontal"
          />

          {/* 阈值 */}
          <SliderInputFormField
            name="parser_config.raptor.threshold"
            label={t('knowledge.settings.raptor.threshold')}
            tooltip={t('knowledge.settings.raptor.thresholdTooltip')}
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.1}
            layout="horizontal"
          />

          {/* 最大聚类数 */}
          <SliderInputFormField
            name="parser_config.raptor.max_cluster"
            label={t('knowledge.settings.raptor.maxCluster')}
            tooltip={t('knowledge.settings.raptor.maxClusterTooltip')}
            min={1}
            max={1024}
            step={1}
            defaultValue={64}
            layout="horizontal"
          />

          {/* 随机种子 */}
          <FormField
            control={form.control}
            name="parser_config.raptor.random_seed"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormLabel className="w-1/4 shrink-0 text-sm text-text-secondary">
                  {t('knowledge.settings.raptor.randomSeed')}
                </FormLabel>
                <div className="flex w-3/4 items-center gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      className="h-9 flex-1"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRandomSeed}
                    className="h-9 px-3"
                    title={t('knowledge.settings.raptor.randomSeedTitle')}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}

export default RaptorFormFields
