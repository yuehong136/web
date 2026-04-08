import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'
import type { IMessageNode } from '../../types'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { NodeHandleId } from '../../constant'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { getMessagePreviewText } from '../../utils/message-content'

function InnerMessageNode({ id, data, isConnectable, selected }: NodeProps<IMessageNode>) {
  const content = getMessagePreviewText(data.form?.content)

  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
    >
      <NodeWrapper selected={selected} id={id}>
        <LeftEndHandle />
        <CommonHandle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          id={NodeHandleId.Start}
          style={RightHandleStyle}
          isConnectableEnd={false}
          nodeId={id}
        />
        <NodeHeader
          id={id}
          name={data.name}
          label={data.label}
          icon={<MessageSquare className="w-4 h-4" style={{ color: 'var(--color-components-canvas-icon-message)' }} />}
        />
        <div className="px-3 py-2">
          <div className="text-xs text-text-tertiary line-clamp-2">
            {content || '暂无内容'}
          </div>
        </div>
      </NodeWrapper>
    </ToolBar>
  )
}

export const MessageNode = memo(InnerMessageNode)
