import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { Scissors } from 'lucide-react'
import { NodeHandleId } from '../../constant'
import { LabelCard } from './card'
import { CommonHandle } from './handle'
import { LeftHandleStyle, RightHandleStyle } from './handle-icon'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'

function InnerSplitterNode({
  id,
  data,
  isConnectable,
  selected,
}: NodeProps) {
  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label as string}
      showRun={false}
      showCopy={false}
    >
      <NodeWrapper selected={selected} id={id}>
        <CommonHandle
          id={NodeHandleId.End}
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          style={LeftHandleStyle}
          nodeId={id}
        />
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
          name={data.name as string}
          label={data.label as string}
          icon={<Scissors className="w-4 h-4" style={{ color: 'var(--color-components-canvas-icon-splitter)' }} />}
        />
        <LabelCard className="text-text-primary">{data.name as string}</LabelCard>
      </NodeWrapper>
    </ToolBar>
  )
}

export const SplitterNode = memo(InnerSplitterNode)
