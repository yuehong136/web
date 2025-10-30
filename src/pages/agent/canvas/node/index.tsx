import type { IRagNode } from '../../types'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import type { PropsWithChildren } from 'react'
import { memo } from 'react'
import { NodeHandleId } from '../../constant'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'

type RagNodeProps = NodeProps<IRagNode> & PropsWithChildren

function InnerRagNode({
  id,
  data,
  isConnectable = true,
  selected,
  children,
}: RagNodeProps) {
  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
    >
      <NodeWrapper selected={selected}>
        <LeftEndHandle />
        <CommonHandle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          id={NodeHandleId.Start}
          style={RightHandleStyle}
          isConnectableEnd={false}
        />
        <NodeHeader id={id} name={data.name} label={data.label} />
        {children}
      </NodeWrapper>
    </ToolBar>
  )
}

export const RagNode = memo(InnerRagNode)

