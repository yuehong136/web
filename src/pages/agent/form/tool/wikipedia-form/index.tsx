import { z } from 'zod'
import { LanguageOptions } from '../../../options'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolNumberField, ToolSelectField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  top_n: z.coerce.number().optional(),
  language: z.string().optional(),
})

export default function WikipediaToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolNumberField
        name="top_n"
        label={t('topN', 'Top N Results')}
        fallback={10}
      />
      <ToolSelectField
        name="language"
        label={t('language', 'Language')}
        options={LanguageOptions}
        searchable
      />
    </ToolConfigForm>
  )
}
