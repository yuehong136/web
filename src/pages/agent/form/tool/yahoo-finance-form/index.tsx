import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolSwitchField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  info: z.boolean().optional(),
  history: z.boolean().optional(),
  financials: z.boolean().optional(),
  balance_sheet: z.boolean().optional(),
  cash_flow_statement: z.boolean().optional(),
  news: z.boolean().optional(),
})

export default function YahooFinanceToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolSwitchField name="info" label={t('info', 'Info')} />
      <ToolSwitchField name="history" label={t('history', 'History')} />
      <ToolSwitchField
        name="financials"
        label={t('financials', 'Financials')}
      />
      <ToolSwitchField
        name="balance_sheet"
        label={t('balanceSheet', 'Balance Sheet')}
      />
      <ToolSwitchField
        name="cash_flow_statement"
        label={t('cashFlowStatement', 'Cash Flow Statement')}
      />
      <ToolSwitchField name="news" label={t('news', 'News')} />
    </ToolConfigForm>
  )
}
