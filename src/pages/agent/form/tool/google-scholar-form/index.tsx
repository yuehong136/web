import { useMemo } from 'react'
import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import {
  ToolNumberField,
  ToolSelectField,
  ToolSwitchField,
  useFlowLabel,
} from '../tool-fields'

const schema = z.object({
  top_n: z.coerce.number().optional(),
  sort_by: z.string().optional(),
  year_low: z.coerce.number().optional(),
  year_high: z.coerce.number().optional(),
  patents: z.boolean().optional(),
})

export default function GoogleScholarToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()
  const sortOptions = useMemo(
    () =>
      ['relevance', 'date'].map((value) => ({
        value,
        label: t(value, value),
      })),
    [t],
  )

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolNumberField
        name="top_n"
        label={t('topN', 'Top N Results')}
        fallback={12}
      />
      <ToolSelectField
        name="sort_by"
        label={t('sortBy', 'Sort By')}
        options={sortOptions}
      />
      <ToolNumberField
        name="year_low"
        label={t('yearLow', 'Year Low')}
        fallback={0}
        min={0}
      />
      <ToolNumberField
        name="year_high"
        label={t('yearHigh', 'Year High')}
        fallback={0}
        min={0}
      />
      <ToolSwitchField name="patents" label={t('patents', 'Patents')} />
    </ToolConfigForm>
  )
}
