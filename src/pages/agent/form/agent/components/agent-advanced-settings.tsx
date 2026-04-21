import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import { ChevronDown } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { AgentExceptionMethod } from '../../../constant'
import { LlmSetting } from '../../components'

interface AgentAdvancedSettingsProps {
  showMaxRounds?: boolean
}

export function AgentAdvancedSettings({
  showMaxRounds = false,
}: AgentAdvancedSettingsProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const exceptionMethod = useWatch({
    control: form.control,
    name: 'exception_method',
  })

  const exceptionMethodOptions = Object.values(AgentExceptionMethod).map(
    (value) => ({
      label: t(`flow.${value}`, value),
      value,
    }),
  )

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
        <ChevronDown className="size-4" />
        {t('flow.advancedSettings', 'Advanced Settings')}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="message_history_window_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('flow.messageHistoryWindowSize', 'Message History Window')}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? 12}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cite"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>{t('flow.cite', 'Citation')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_retries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.maxRetries', 'Max Retries')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? 3}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="delay_after_error"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('flow.delayAfterError', 'Delay After Error (s)')}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  {...field}
                  value={field.value ?? 1}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />

        {showMaxRounds && (
          <FormField
            control={form.control}
            name="max_rounds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.maxRounds', 'Max Rounds')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value ?? 1}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="exception_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.exceptionMethod', 'Exception Method')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={exceptionMethodOptions}
                  allowClear
                />
              </FormControl>
            </FormItem>
          )}
        />

        {exceptionMethod === AgentExceptionMethod.Comment && (
          <FormField
            control={form.control}
            name="exception_default_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('flow.ExceptionDefaultValue', 'Exception Default Value')}
                </FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <LlmSetting hideModel />
      </CollapsibleContent>
    </Collapsible>
  )
}
