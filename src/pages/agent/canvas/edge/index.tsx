import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import { X } from 'lucide-react'
import { memo, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useGraphStore from '../../store'
import { cn } from '@/lib/utils'
import { NodeHandleId, Operator } from '../../constant'
import { AgentInstanceContext } from '../../context'

function InnerButtonEdge({
  id,
  source,
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
  const { t } = useTranslation()
  const { deleteEdgeById, getOperatorTypeFromId } = useGraphStore(
    (state) => state,
  )

  const {
    currentSendLoading,
    startButNotFinishedNodeIds = [],
    successNodeIds = [],
  } = useContext(AgentInstanceContext)

  const isFlowing = useMemo(() => {
    if (!currentSendLoading || !source || !target) return false
    return (
      startButNotFinishedNodeIds.includes(target) &&
      successNodeIds.includes(source)
    )
  }, [
    currentSendLoading,
    source,
    startButNotFinishedNodeIds,
    successNodeIds,
    target,
  ])

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
      ? {
          strokeWidth: 2,
          stroke: 'var(--color-components-canvas-edge-stroke-selected)',
        }
      : {}
  }, [selected])

  const isTargetPlaceholder = useMemo(() => {
    return getOperatorTypeFromId(target) === Operator.Placeholder
  }, [getOperatorTypeFromId, target])

  const placeholderHighlightStyle = useMemo(() => {
    const isHighlighted = isTargetPlaceholder
    return isHighlighted
      ? {
          strokeWidth: 2,
          stroke: 'var(--color-components-canvas-edge-stroke-selected)',
        }
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

  const activeMarkerEnd =
    selected || isTargetPlaceholder ? 'url(#selected-marker)' : markerEnd

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={activeMarkerEnd}
        // A flowing edge (feeding a running node) wins over selection; its
        // stroke and reduced-motion-safe dash animation live in overrides.css.
        style={
          isFlowing
            ? style
            : { ...style, ...selectedStyle, ...placeholderHighlightStyle }
        }
        className={cn(
          'stroke-components-canvas-edge-marker',
          isFlowing && 'canvas-edge-flowing',
        )}
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
              'flex size-4 items-center justify-center rounded-radius-full border border-status-error-border bg-components-canvas-node-bg text-status-error shadow-elevation-low hover:bg-status-error-subtle',
              'invisible',
              { visible },
            )}
            type="button"
            aria-label={t('agent.canvas.deleteEdge')}
            title={t('agent.canvas.deleteEdge')}
            onClick={onEdgeClick}
          >
            <X aria-hidden className="size-2.5" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const ButtonEdge = memo(InnerButtonEdge)
