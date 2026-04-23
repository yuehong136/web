import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { memo } from 'react'
import { RewriteQuestionHandleId } from '../../constant'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { LLMLabelCard } from './card'
import { CommonHandle } from './handle'
import { LeftHandleStyle, RightHandleStyle } from './handle-icon'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import type { BaseNode } from '../../types'

type RewriteQuestionForm = {
  llm_id?: string
}

function InnerRewriteNode({
  id,
  data,
  isConnectable = true,
  selected,
}: NodeProps<BaseNode<RewriteQuestionForm>>) {
  const label = data.label as string

  return (
    <ToolBar
      selected={selected}
      id={id}
      label={label}
      showRun={needsSingleStepDebugging(label)}
      showCopy={showCopyIcon(label)}
    >
      <NodeWrapper selected={selected} id={id}>
        <Handle
          id={RewriteQuestionHandleId.Left}
          type="source"
          position={Position.Left}
          isConnectable={isConnectable}
          style={LeftHandleStyle}
          className="!size-2 !border-none !bg-components-canvas-handle-bg"
        />
        <CommonHandle
          id={RewriteQuestionHandleId.Right}
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          style={RightHandleStyle}
          nodeId={id}
        />
        <NodeHeader id={id} name={data.name as string} label={label} />
        <div className="px-3 py-2">
          <LLMLabelCard llmId={data.form?.llm_id} />
        </div>
      </NodeWrapper>
    </ToolBar>
  )
}

export const RewriteNode = memo(InnerRewriteNode)
