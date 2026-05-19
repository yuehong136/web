import { useMemo } from 'react'
import { z } from 'zod'
import { BingCountryOptions, BingLanguageOptions } from '../../../options'
import type { INextOperatorForm } from '../../../types'
import {
  ToolNumberField,
  ToolSelectField,
  ToolTextField,
  useFlowLabel,
} from '../tool-fields'
import { ToolConfigForm } from '../tool-config-form'

const schema = z.object({
  top_n: z.coerce.number().optional(),
  channel: z.string().optional(),
  api_key: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
})

export default function BingToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()
  const channelOptions = useMemo(
    () => ['Webpages', 'News'].map((value) => ({ label: value, value })),
    [],
  )

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolNumberField
        name="top_n"
        label={t('topN', 'Top N Results')}
        fallback={10}
      />
      <ToolSelectField
        name="channel"
        label={t('channel', 'Channel')}
        options={channelOptions}
        searchable
      />
      <ToolTextField
        name="api_key"
        label={t('apiKey', 'API Key')}
        type="password"
      />
      <ToolSelectField
        name="country"
        label={t('country', 'Country')}
        options={BingCountryOptions}
        searchable
      />
      <ToolSelectField
        name="language"
        label={t('language', 'Language')}
        options={BingLanguageOptions}
        searchable
      />
    </ToolConfigForm>
  )
}
