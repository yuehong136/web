import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { RagNode } from './index'
import { LabelCard } from './card'
import type { BaseNode } from '../../types'

function InnerDataOperationsNode({
  ...props
}: NodeProps<BaseNode<any>>) {
  const { data } = props
  const operations = data.form?.operations

  return (
    <RagNode {...props}>
      <div className="px-3 py-2">
        <LabelCard>{operations || 'select_keys'}</LabelCard>
      </div>
    </RagNode>
  )
}

export const DataOperationsNode = memo(InnerDataOperationsNode)
