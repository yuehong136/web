import { useSetModalState } from '@/hooks/common-hooks'
import { cn } from '@/lib/utils'
import type { HandleProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { memo, useMemo } from 'react'
import { NodeHandleId } from '../../constant'
import { HandleContext } from '../../context'
import { useIsPipeline } from '../../hooks/use-is-pipeline'
import useGraphStore from '../../store'
import {
  canOpenHandleDropdown,
  isPipelineHandleConnectable,
} from '../../utils/connection-handles'
import { useDropdownManager } from '../context'
import { NextStepDropdown } from './dropdown/next-step-dropdown'

interface LeftEndHandleProps extends Omit<HandleProps, 'type' | 'position'> {
  nodeId: string
}

export const LeftEndHandle = memo(({ nodeId, ...props }: LeftEndHandleProps) => {
  const isPipeline = useIsPipeline()
  const hasUpstreamConnection = useGraphStore((state) =>
    state.hasUpstreamNode(nodeId),
  )
  const baseIsConnectable = props.isConnectable ?? true
  const isConnectable =
    baseIsConnectable &&
    isPipelineHandleConnectable({
      isPipeline,
      handleType: 'target',
      hasDownstreamConnection: false,
      hasUpstreamConnection,
    })

  return (
    <Handle
      type="target"
      position={Position.Left}
      id={NodeHandleId.End}
      isConnectable={isConnectable}
      className="!size-2 !border-none !bg-components-canvas-handle-bg"
      {...props}
    />
  )
})

LeftEndHandle.displayName = 'LeftEndHandle'

interface CommonHandleProps extends HandleProps {
  nodeId: string
}

export const CommonHandle = memo(
  ({ nodeId, className, ...props }: CommonHandleProps) => {
    const { visible, hideModal, showModal } = useSetModalState()
    const { canShowDropdown, setActiveDropdown, clearActiveDropdown } =
      useDropdownManager()
    const { hasDownstreamNode, hasUpstreamNode } = useGraphStore(
      (state) => state,
    )
    const isPipeline = useIsPipeline()
    const hasDownstreamConnection = hasDownstreamNode(nodeId)
    const hasUpstreamConnection = hasUpstreamNode(nodeId)
    const baseIsConnectable = props.isConnectable ?? true
    const isConnectable =
      baseIsConnectable &&
      isPipelineHandleConnectable({
        isPipeline,
        handleType: props.type,
        hasDownstreamConnection,
        hasUpstreamConnection,
      })
    const canShowNextStepDropdown =
      baseIsConnectable &&
      canOpenHandleDropdown({
        isPipeline,
        handleType: props.type,
        hasDownstreamConnection,
        hasUpstreamConnection,
      })

    const value = useMemo(
      () => ({
        nodeId,
        id: props.id || undefined,
        type: props.type,
        position: props.position,
        isFromConnectionDrag: false,
      }),
      [nodeId, props.id, props.position, props.type],
    )

    return (
      <HandleContext.Provider value={value}>
        <Handle
          {...props}
          isConnectable={isConnectable}
          className={cn(
            'inline-flex items-center justify-center !border-none !bg-components-canvas-handle-bg group-hover:!size-4 group-hover:!rounded-sm',
            className,
          )}
          onClick={(e) => {
            e.stopPropagation()

            if (!canShowNextStepDropdown) {
              return
            }

            if (!canShowDropdown()) {
              return
            }

            setActiveDropdown('handle')
            showModal()
          }}
        >
          <Plus className="hidden size-3 pointer-events-none text-components-canvas-handle-icon group-hover:inline-block" />
          {visible && (
            <NextStepDropdown
              nodeId={nodeId}
              hideModal={() => {
                hideModal()
                clearActiveDropdown()
              }}
            >
              <span />
            </NextStepDropdown>
          )}
        </Handle>
      </HandleContext.Provider>
    )
  },
)

CommonHandle.displayName = 'CommonHandle'
