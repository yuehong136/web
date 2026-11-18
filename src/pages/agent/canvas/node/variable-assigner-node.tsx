import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { RagNode } from './index'
import { LabelCard } from './card'
import type { BaseNode } from '../../types'
import { SummaryList } from './summary-list'
import { useGetVariableLabelOrTypeByValue } from '../../hooks/use-get-begin-query'
import { getVariableAssignerOperatorLabel } from '../../form/variable-assigner/utils'

type VariableAssignerSummary = {
  variables?: Array<{
    variable?: string
    operator?: string
  }>
}

function InnerVariableAssignerNode({
  ...props
}: NodeProps<BaseNode<VariableAssignerSummary>>) {
  const { id, data } = props
  const { t } = useTranslation()
  const variables = data.form?.variables || []
  const { getLabel } = useGetVariableLabelOrTypeByValue({ nodeId: id })

  return (
    <RagNode {...props}>
      <SummaryList
        items={variables}
        empty={
          <LabelCard>{t('flow.noVariables', 'No variables yet')}</LabelCard>
        }
        renderItem={(variable, idx, { withDivider }) => (
          <section
            key={`${id}-variable-${idx}`}
            className={cn(
              withDivider && 'border-t border-line-subtle pt-space-sm',
            )}
          >
            <LabelCard className="flex justify-between gap-2">
              <span className="flex min-w-0 flex-1 truncate">
                {getLabel(variable?.variable)}
              </span>
              <span className="rounded-radius-sm border border-line px-space-xs py-px text-[11px] leading-5 text-fg-muted">
                {getVariableAssignerOperatorLabel(t, variable?.operator)}
              </span>
            </LabelCard>
          </section>
        )}
      />
    </RagNode>
  )
}

export const VariableAssignerNode = memo(InnerVariableAssignerNode)
