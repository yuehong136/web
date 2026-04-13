import { cn } from '@/lib/utils'
import type { NodeProps } from '@xyflow/react'
import { NodeResizeControl, Position } from '@xyflow/react'
import { memo } from 'react'
import { NodeHandleId, Operator } from '../../constant'
import OperatorIcon from '../../operator-icon'
import type { IIterationNode, IIterationStartNode } from '../../types'
import { CommonHandle, LeftEndHandle } from './handle'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { ResizeIcon, controlStyle } from './resize-icon'

export function InnerIterationNode({
  id,
  data,
  isConnectable = true,
  selected,
}: NodeProps<IIterationNode>) {
  return (
    <ToolBar selected={selected} id={id} label={data.label} showRun={false}>
      <section
        className={cn(
          'h-full bg-transparent rounded-radius-md group border border-border-primary border-t-0',
          { 'border-[var(--color-components-canvas-node-border-selected)]': selected },
        )}
      >
        <NodeResizeControl style={controlStyle} minWidth={100} minHeight={50}>
          <ResizeIcon />
        </NodeResizeControl>
        <LeftEndHandle />
        <CommonHandle
          id={NodeHandleId.Start}
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          nodeId={id}
        />
        <NodeHeader
          id={id}
          name={data.name}
          label={data.label}
          wrapperClassName={cn(
            'bg-surface-secondary p-space-sm rounded-radius-md absolute w-full -top-9 left-0 border-x border-t border-border-primary',
            { 'border-[var(--color-components-canvas-node-border-selected)]': selected },
          )}
        />
      </section>
    </ToolBar>
  )
}

export function InnerIterationStartNode({
  isConnectable = true,
  id,
  selected,
}: NodeProps<IIterationStartNode>) {
  return (
    <NodeWrapper className="w-20" selected={selected} id={id}>
      <CommonHandle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        isConnectableEnd={false}
        id={NodeHandleId.Start}
        nodeId={id}
      />
      <div>
        <OperatorIcon name={Operator.Begin} />
      </div>
    </NodeWrapper>
  )
}

export const IterationStartNode = memo(InnerIterationStartNode)
export const IterationNode = memo(InnerIterationNode)
