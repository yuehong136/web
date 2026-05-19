import { useMemo } from 'react'
import { z } from 'zod'
import { CrawlerResultOptions } from '../../../options'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolSelectField, ToolTextField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  proxy: z.string().optional(),
  extract_type: z.string().optional(),
})

export default function CrawlerToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()
  const extractTypeOptions = useMemo(
    () =>
      CrawlerResultOptions.map((value) => ({
        value,
        label: t(`crawlerResultOptions.${value}`, value),
      })),
    [t],
  )

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolTextField
        name="proxy"
        label={t('proxy', 'Proxy')}
        placeholder="http://127.0.0.1:8888"
      />
      <ToolSelectField
        name="extract_type"
        label={t('extractType', 'Extract Type')}
        options={extractTypeOptions}
        searchable
      />
    </ToolConfigForm>
  )
}
