import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  RateLimitPerList,
  WebhookMaxBodySize,
  WebhookMethod,
  WebhookRateLimitPer,
  WebhookSecurityAuthType,
} from '../../../constant'
import { useBuildWebhookUrl } from '../../../hooks/use-build-webhook-url'
import { DynamicStringForm } from '../../components'
import { WebhookAuth } from './auth'
import { WebhookRequestSchema } from './request-schema'
import { WebhookResponse } from './response'

const requestLimitMap: Record<string, number> = {
  [WebhookRateLimitPer.Second]: 100,
  [WebhookRateLimitPer.Minute]: 1000,
  [WebhookRateLimitPer.Hour]: 10000,
  [WebhookRateLimitPer.Day]: 100000,
}

function buildOptions(values: string[]) {
  return values.map((value) => ({
    label: value,
    value,
  }))
}

function WebhookUrlCard() {
  const { t } = useTranslation()
  const text = useBuildWebhookUrl()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }, [text])

  return (
    <div className="rounded-radius-md border border-border-default bg-surface-secondary/40 p-space-base">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="min-w-0">
          <div className="text-sm font-medium text-text-primary">
            {t('flow.webhook.name', 'Webhook')}
          </div>
          <div className="mt-space-xs break-all text-sm text-text-secondary">
            {text}
          </div>
        </div>
        <Button type="button" variant="outline" onClick={handleCopy}>
          {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
        </Button>
      </div>
    </div>
  )
}

export function BeginWebhookFields() {
  const { t } = useTranslation()
  const form = useFormContext()
  const rateLimitPer = useWatch({
    control: form.control,
    name: 'security.rate_limit.per',
  })

  const rateLimitMax = useMemo(
    () => requestLimitMap[rateLimitPer as string] ?? 100,
    [rateLimitPer],
  )

  return (
    <section className="space-y-space-lg">
      <WebhookUrlCard />

      <FormField
        control={form.control}
        name="methods"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.webhook.methods', 'Methods')}</FormLabel>
            <FormControl>
              <MultiSelectWithSearch
                value={field.value ?? []}
                onChange={field.onChange}
                options={buildOptions(Object.values(WebhookMethod))}
                placeholder={t('fileManager.pleaseSelect', 'Please select')}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <CollapsibleSection
        title={t('flow.security', 'Security')}
        defaultOpen
      >
        <div className="space-y-space-md">
          <FormField
            control={form.control}
            name="security.auth_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.webhook.authType', 'Auth type')}</FormLabel>
                <FormControl>
                  <SelectWithSearch
                    value={field.value}
                    onChange={field.onChange}
                    options={buildOptions(Object.values(WebhookSecurityAuthType))}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <WebhookAuth />

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <FormField
              control={form.control}
              name="security.rate_limit.limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.webhook.limit', 'Rate limit')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={rateLimitMax}
                      {...field}
                      value={field.value ?? 10}
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
              name="security.rate_limit.per"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.webhook.per', 'Per')}</FormLabel>
                  <FormControl>
                    <SelectWithSearch
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        form.setValue('security.rate_limit.limit', requestLimitMap[value] ?? 100, {
                          shouldDirty: true,
                        })
                      }}
                      options={buildOptions(RateLimitPerList)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="security.max_body_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.webhook.maxBodySize', 'Max body size')}</FormLabel>
                <FormControl>
                  <SelectWithSearch
                    value={field.value}
                    onChange={field.onChange}
                    options={buildOptions(WebhookMaxBodySize)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <DynamicStringForm
            name="security.ip_whitelist"
            label={t('flow.webhook.ipWhitelist', 'IP whitelist')}
          />
        </div>
      </CollapsibleSection>

      <WebhookRequestSchema />
      <WebhookResponse />
    </section>
  )
}
