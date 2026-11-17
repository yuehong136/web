import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { memo } from 'react'
import { NodeHandleId } from '../../constant'
import { CommonHandle } from './handle'
import { LeftHandleStyle } from './handle-icon'
import { NodeWrapper } from './node-wrapper'

function InnerPlaceholderNode({ id, selected }: NodeProps) {
  return (
    <NodeWrapper
      selected={selected}
      className="border-dashed opacity-60"
      id={id}
    >
      <CommonHandle
        type="target"
        position={Position.Left}
        isConnectable
        style={LeftHandleStyle}
        id={NodeHandleId.End}
        nodeId={id}
      />
      <div className="space-y-space-sm px-space-sm py-space-base">
        <div className="size-5 rounded-radius-sm bg-components-canvas-skeleton-bg motion-safe:animate-pulse" />
        <div className="h-4 w-full rounded-radius-sm bg-components-canvas-skeleton-bg motion-safe:animate-pulse" />
      </div>
    </NodeWrapper>
  )
}

export const PlaceholderNode = memo(InnerPlaceholderNode)
