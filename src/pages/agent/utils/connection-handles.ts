import type { Connection, Edge, HandleType } from '@xyflow/react'
import { NodeHandleId } from '../constant'

export function canStartConnectionDrag(handleType: HandleType | null | undefined) {
  return handleType === 'source'
}

export function hasValidHandleDirection(
  connection: Pick<Connection | Edge, 'sourceHandle' | 'targetHandle'>,
) {
  if (connection.sourceHandle === NodeHandleId.End) {
    return false
  }

  if (connection.targetHandle === NodeHandleId.Start) {
    return false
  }

  return true
}
