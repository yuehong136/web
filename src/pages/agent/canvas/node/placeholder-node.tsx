import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { memo } from 'react'
import { NodeHandleId } from '../../constant'
import { CommonHandle } from './handle'
import { LeftHandleStyle } from './handle-icon'
import { NodeWrapper } from './node-wrapper'

function InnerPlaceholderNode({ id, selected }: NodeProps) {
  return (
    <NodeWrapper selected={selected} className="opacity-50" id={id}>
      <CommonHandle
        type="target"
        position={Position.Left}
        isConnectable
        style={LeftHandleStyle}
        id={NodeHandleId.End}
        nodeId={id}
      />
      <div className="px-3 py-4 space-y-2">
        <div className="h-6 w-6 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-components-canvas-skeleton-bg)' }} />
        <div className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--color-components-canvas-skeleton-bg)' }} />
      </div>
    </NodeWrapper>
  )
}

export const PlaceholderNode = memo(InnerPlaceholderNode)
