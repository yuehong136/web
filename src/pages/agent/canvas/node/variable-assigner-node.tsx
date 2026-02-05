import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { RagNode } from './index'
import { LabelCard } from './card'
import type { BaseNode } from '../../types'

function InnerVariableAssignerNode({
  ...props
}: NodeProps<BaseNode<any>>) {
  const { data } = props
  const variables = data.form?.variables || []

  return (
    <RagNode {...props}>
      <div className="px-3 py-2 space-y-1">
        {variables.map((v: any, idx: number) => (
          <LabelCard key={idx} className="flex justify-between gap-2">
            <span className="flex truncate min-w-0">{v.variable}</span>
            <span className="border px-1 rounded-sm text-xs">{v.operator}</span>
          </LabelCard>
        ))}
        {variables.length === 0 && (
          <LabelCard>No variables configured</LabelCard>
        )}
      </div>
    </RagNode>
  )
}

export const VariableAssignerNode = memo(InnerVariableAssignerNode)
