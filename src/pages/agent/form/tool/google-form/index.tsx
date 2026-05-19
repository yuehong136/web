import { z } from 'zod'
import { GoogleCountryOptions, GoogleLanguageOptions } from '../../../options'
import type { INextOperatorForm } from '../../../types'
import { ApiKeyField } from '../../components'
import { ToolConfigForm } from '../tool-config-form'
import { ToolSelectField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  api_key: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
})

export default function GoogleToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ApiKeyField />
      <ToolSelectField
        name="country"
        label={t('country', 'Country')}
        options={GoogleCountryOptions}
        searchable
      />
      <ToolSelectField
        name="language"
        label={t('language', 'Language')}
        options={GoogleLanguageOptions}
        searchable
      />
    </ToolConfigForm>
  )
}
