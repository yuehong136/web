import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { IRagNode } from '../../types'
import { LLMLabelCard } from './card'
import { RagNode } from './index'

function InnerExtractorNode({ data, ...props }: NodeProps<IRagNode>) {
  return (
    <RagNode {...props} data={data}>
      <LLMLabelCard
        llmId={((data.form ?? {}) as { llm_id?: string }).llm_id}
      />
    </RagNode>
  )
}

export const ExtractorNode = memo(InnerExtractorNode)
