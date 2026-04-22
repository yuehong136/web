import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import { RagNode } from './index'
import { LabelCard } from './card'
import type { BaseNode } from '../../types'
import { SummaryList } from './summary-list'
import { useGetVariableLabelOrTypeByValue } from '../../hooks/use-get-begin-query'

type VariableAggregatorSummary = {
  groups?: Array<{
    group_name?: string
    type?: string
    variables?: Array<{
      value?: string
    }>
  }>
}

function InnerVariableAggregatorNode({
  ...props
}: NodeProps<BaseNode<VariableAggregatorSummary>>) {
  const { id, data } = props
  const groups = data.form?.groups || []
  const { getLabel } = useGetVariableLabelOrTypeByValue({ nodeId: id })

  return (
    <RagNode {...props}>
      <SummaryList
        items={groups}
        empty={<LabelCard>No groups configured</LabelCard>}
        renderItem={(group, idx, { withDivider }) => (
          <section
            key={`${id}-group-${idx}`}
            className={cn('space-y-space-sm', withDivider && 'border-t border-border-subtle pt-space-sm')}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate">
                {group?.group_name}
              </span>
              <span className="text-text-secondary">{group?.type}</span>
            </div>
            <div className="space-y-space-xs">
              {(group?.variables || []).map((variable, variableIdx) => (
                <LabelCard
                  key={`${id}-group-${idx}-variable-${variableIdx}`}
                  className="truncate"
                >
                  {getLabel(variable?.value)}
                </LabelCard>
              ))}
            </div>
          </section>
        )}
      />
    </RagNode>
  )
}

export const VariableAggregatorNode = memo(InnerVariableAggregatorNode)
