import { CollapsibleSection } from '@/components/ui/collapsible-section'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Textarea } from '@/components/ui/textarea'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  WebhookExecutionMode,
} from '../../../constant'

function buildOptions(values: string[]) {
  return values.map((value) => ({
    label: value,
    value,
  }))
}

export function WebhookResponse() {
  const { t } = useTranslation()
  const form = useFormContext()
  const executionMode = useWatch({
    control: form.control,
    name: 'execution_mode',
  })

  return (
    <CollapsibleSection
      title={t('flow.webhook.response', 'Response')}
      defaultOpen
    >
      <div className="space-y-space-md">
        <FormField
          control={form.control}
          name="execution_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel tooltip={t('flow.webhook.executionModeTip', 'Choose how the webhook returns.')}>
                {t('flow.webhook.executionMode', 'Execution mode')}
              </FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value}
                  onChange={field.onChange}
                  options={buildOptions(Object.values(WebhookExecutionMode))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {executionMode === WebhookExecutionMode.Immediately && (
          <>
            <FormField
              control={form.control}
              name="response.status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.webhook.status', 'Status')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={100}
                      max={599}
                      {...field}
                      value={field.value ?? 200}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="response.body_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.webhook.bodyTemplate', 'Body template')}</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </CollapsibleSection>
  )
}
