import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import type { BaseNode } from '../../types'
import { LeftEndHandle } from './handle'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'

function InnerExitLoopNode({
  id,
  data,
  selected,
}: NodeProps<BaseNode<Record<string, never>>>) {
  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={false}
      showCopy={false}
    >
      <NodeWrapper selected={selected} id={id}>
        <LeftEndHandle nodeId={id} />
        <NodeHeader id={id} name={data.name} label={data.label} />
      </NodeWrapper>
    </ToolBar>
  )
}

export const ExitLoopNode = memo(InnerExitLoopNode)
