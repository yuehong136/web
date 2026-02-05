import type {
  Edge,
  EdgeProps,
} from '@xyflow/react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from '@xyflow/react'
import { memo, useMemo } from 'react'
import useGraphStore from '../../store'
import { cn } from '@/lib/utils'
import { NodeHandleId, Operator } from '../../constant'

function InnerButtonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  target,
  style = {},
  markerEnd,
  selected,
  data,
  sourceHandleId,
}: EdgeProps<Edge<{ isHovered: boolean }>>) {
  const { deleteEdgeById, getOperatorTypeFromId } = useGraphStore(
    (state) => state,
  )

  // 调试日志
  console.log('🔗 [ButtonEdge] 渲染边:', {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    target,
  })

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const selectedStyle = useMemo(() => {
    return selected
      ? { strokeWidth: 2, stroke: 'var(--color-components-canvas-edge-stroke-selected)' }
      : {}
  }, [selected])

  const isTargetPlaceholder = useMemo(() => {
    return getOperatorTypeFromId(target) === Operator.Placeholder
  }, [getOperatorTypeFromId, target])

  const placeholderHighlightStyle = useMemo(() => {
    const isHighlighted = isTargetPlaceholder
    return isHighlighted
      ? { strokeWidth: 2, stroke: 'var(--color-components-canvas-edge-stroke-selected)' }
      : {}
  }, [isTargetPlaceholder])

  const onEdgeClick = () => {
    deleteEdgeById(id)
  }

  const visible = useMemo(() => {
    return (
      data?.isHovered &&
      sourceHandleId !== NodeHandleId.Tool &&
      sourceHandleId !== NodeHandleId.AgentBottom &&
      !target.startsWith(Operator.Tool) &&
      !isTargetPlaceholder
    )
  }, [data?.isHovered, isTargetPlaceholder, sourceHandleId, target])

  const activeMarkerEnd = selected || isTargetPlaceholder
    ? 'url(#selected-marker)'
    : markerEnd

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={activeMarkerEnd}
        style={{
          ...style,
          ...selectedStyle,
          ...placeholderHighlightStyle,
        }}
        className="text-text-tertiary"
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
            zIndex: 1001,
          }}
          className="nodrag nopan"
        >
          <button
            className={cn(
              'size-4 border border-state-error text-state-error rounded-full leading-none bg-surface-primary hover:bg-state-error-subtle',
              'invisible',
              { visible },
            )}
            type="button"
            onClick={onEdgeClick}
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const ButtonEdge = memo(InnerButtonEdge)

