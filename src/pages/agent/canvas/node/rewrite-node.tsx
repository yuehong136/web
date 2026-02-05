import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { RagNode } from './index'
import { LLMLabelCard } from './card'
import type { BaseNode } from '../../types'

function InnerRewriteNode({ ...props }: NodeProps<BaseNode<any>>) {
  const { data } = props

  return (
    <RagNode {...props}>
      <div className="px-3 py-2">
        <LLMLabelCard llmId={data.form?.llm_id} />
      </div>
    </RagNode>
  )
}

export const RewriteNode = memo(InnerRewriteNode)
