import { Position, type Connection, type Edge, type HandleType } from '@xyflow/react'
import { NodeHandleId, RewriteQuestionHandleId } from '../constant'

export function canStartConnectionDrag(handleType: HandleType | null | undefined) {
  return handleType === 'source'
}

interface PipelineHandleState {
  isPipeline: boolean
  handleType: HandleType | null | undefined
  hasDownstreamConnection: boolean
  hasUpstreamConnection: boolean
}

export function getConnectionStartPosition(handleId: string | null | undefined) {
  if (handleId === RewriteQuestionHandleId.Left) {
    return Position.Left
  }

  return Position.Right
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

export function isPipelineHandleConnectable({
  isPipeline,
  handleType,
  hasDownstreamConnection,
  hasUpstreamConnection,
}: PipelineHandleState) {
  if (!isPipeline) {
    return true
  }

  if (handleType === 'target') {
    return !hasUpstreamConnection
  }

  if (handleType === 'source') {
    return true
  }

  return !hasDownstreamConnection
}

export function canOpenHandleDropdown({
  isPipeline,
  handleType,
  hasDownstreamConnection,
  hasUpstreamConnection,
}: PipelineHandleState) {
  if (!isPipeline) {
    return true
  }

  if (handleType === 'target') {
    return !hasUpstreamConnection
  }

  if (handleType === 'source') {
    return !hasDownstreamConnection
  }

  return true
}

export function violatesPipelineSingleConnection(params: {
  isPipeline: boolean
  sourceHasDownstreamConnection: boolean
  targetHasUpstreamConnection: boolean
}) {
  if (!params.isPipeline) {
    return false
  }

  return (
    params.sourceHasDownstreamConnection || params.targetHasUpstreamConnection
  )
}
