import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { RagNode } from './index'
import { LabelCard } from './card'
import type { BaseNode } from '../../types'

function InnerVariableAggregatorNode({
  ...props
}: NodeProps<BaseNode<any>>) {
  const { data } = props
  const groups = data.form?.groups || []

  return (
    <RagNode {...props}>
      <div className="px-3 py-2 space-y-1">
        {groups.map((group: any, idx: number) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center gap-2 text-xs">
              <span className="flex-1 min-w-0 truncate">
                {group.group_name}
              </span>
              <span className="text-text-secondary">{group.type}</span>
            </div>
            {group.variables?.map((v: any, vIdx: number) => (
              <LabelCard key={vIdx} className="truncate">
                {v.value}
              </LabelCard>
            ))}
          </div>
        ))}
        {groups.length === 0 && (
          <LabelCard>No groups configured</LabelCard>
        )}
      </div>
    </RagNode>
  )
}

export const VariableAggregatorNode = memo(InnerVariableAggregatorNode)
