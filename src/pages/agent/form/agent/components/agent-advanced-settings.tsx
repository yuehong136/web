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
import { ChevronDown } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { LlmSetting } from '../../components'

export function AgentAdvancedSettings() {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
        <ChevronDown className="size-4" />
        {t('flow.advancedSettings', 'Advanced Settings')}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
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

        <FormField
          control={form.control}
          name="max_rounds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.maxRounds', 'Max Rounds')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
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

        <LlmSetting />
      </CollapsibleContent>
    </Collapsible>
  )
}
