import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import type { BaseNode } from '../../types'
import { InnerIterationNode, InnerIterationStartNode } from './iteration-node'

export function InnerLoopNode({ ...props }: NodeProps<BaseNode<any>>) {
  return <InnerIterationNode {...props} />
}

export const LoopNode = memo(InnerLoopNode)

export function InnerLoopStartNode({ ...props }: NodeProps<BaseNode<any>>) {
  return <InnerIterationStartNode {...props} />
}

export const LoopStartNode = memo(InnerLoopStartNode)
