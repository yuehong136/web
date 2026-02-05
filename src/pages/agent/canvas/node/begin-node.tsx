import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { Play } from 'lucide-react'
import type { IBeginNode } from '../../types'
import { CommonHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { NodeHandleId } from '../../constant'

function InnerBeginNode({ id, data, isConnectable, selected }: NodeProps<IBeginNode>) {
  return (
    <NodeWrapper selected={selected} id={id}>
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
        icon={<Play className="w-4 h-4" style={{ color: 'var(--color-components-canvas-icon-start)' }} />}
      />
      <div className="px-3 py-2">
        <div className="text-xs text-text-tertiary line-clamp-2">
          {data.form?.prologue || 'Start of workflow'}
        </div>
      </div>
    </NodeWrapper>
  )
}

export const BeginNode = memo(InnerBeginNode)
