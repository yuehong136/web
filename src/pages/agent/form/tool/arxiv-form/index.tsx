import { useMemo } from 'react'
import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolNumberField, ToolSelectField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  top_n: z.coerce.number().optional(),
  sort_by: z.string().optional(),
})

export default function ArxivToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()
  const sortOptions = useMemo(
    () =>
      ['submittedDate', 'lastUpdatedDate', 'relevance'].map((value) => ({
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
    </ToolConfigForm>
  )
}
