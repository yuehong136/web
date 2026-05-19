import { useMemo } from 'react'
import { z } from 'zod'
import { WenCaiQueryTypeOptions } from '../../../options'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolNumberField, ToolSelectField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  top_n: z.coerce.number().optional(),
  query_type: z.string().optional(),
})

export default function WenCaiToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()
  const queryTypeOptions = useMemo(
    () =>
      WenCaiQueryTypeOptions.map((value) => ({
        value,
        label: t(`wenCaiQueryTypeOptions.${value}`, value),
      })),
    [t],
  )

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolNumberField
        name="top_n"
        label={t('topN', 'Top N Results')}
        fallback={20}
      />
      <ToolSelectField
        name="query_type"
        label={t('queryType', 'Query Type')}
        options={queryTypeOptions}
      />
    </ToolConfigForm>
  )
}
