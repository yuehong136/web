import { CollapsibleSection } from '@/components/ui/collapsible-section'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  JsonSchemaDataType,
  WebhookContentType,
} from '../../../constant'
import { DynamicRequest } from './dynamic-request'

const FileRequestType = 'file'

function buildOptions(values: string[]) {
  return values.map((value) => ({
    label: value,
    value,
  }))
}

export function WebhookRequestSchema() {
  const { t } = useTranslation()
  const form = useFormContext()
  const contentType = useWatch({
    control: form.control,
    name: 'content_types',
  })

  const bodyOperatorList = useMemo(() => {
    const base = [
      JsonSchemaDataType.String,
      JsonSchemaDataType.Number,
      JsonSchemaDataType.Boolean,
    ]

    return contentType === WebhookContentType.MultipartFormData
      ? [...base, FileRequestType]
      : base
  }, [contentType])

  return (
    <CollapsibleSection
      title={t('flow.webhook.schema', 'Schema')}
      defaultOpen
    >
      <div className="space-y-space-md">
        <FormField
          control={form.control}
          name="content_types"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.contentTypes', 'Content types')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value}
                  onChange={field.onChange}
                  options={buildOptions(Object.values(WebhookContentType))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DynamicRequest
          name="schema.query"
          label={t('flow.webhook.queryParameters', 'Query parameters')}
          operatorList={[
            JsonSchemaDataType.String,
            JsonSchemaDataType.Number,
            JsonSchemaDataType.Boolean,
          ]}
        />
        <DynamicRequest
          name="schema.headers"
          label={t('flow.webhook.headerParameters', 'Header parameters')}
          operatorList={[JsonSchemaDataType.String]}
        />
        <DynamicRequest
          name="schema.body"
          label={t('flow.webhook.requestBodyParameters', 'Request body parameters')}
          operatorList={bodyOperatorList}
        />
      </div>
    </CollapsibleSection>
  )
}
