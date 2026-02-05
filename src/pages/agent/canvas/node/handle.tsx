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
import { useDropdownManager } from '../context'
import { NextStepDropdown } from './dropdown/next-step-dropdown'

export const LeftEndHandle = memo((props: Omit<HandleProps, 'type' | 'position'>) => {
  return (
    <Handle
      type="target"
      position={Position.Left}
      id={NodeHandleId.End}
      className="!bg-surface-accent !size-2 !border-none"
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
    const { hasChildNode } = useGraphStore((state) => state)
    const isPipeline = useIsPipeline()

    const canConnectByPipeline = !(isPipeline && hasChildNode(nodeId))
    const isConnectable = (props.isConnectable ?? true) && canConnectByPipeline

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
            'inline-flex justify-center items-center !bg-surface-accent !border-none group-hover:!size-4 group-hover:!rounded-sm',
            className,
          )}
          onClick={(e) => {
            e.stopPropagation()

            if (!isConnectable) {
              return
            }

            if (!canShowDropdown()) {
              return
            }

            setActiveDropdown('handle')
            showModal()
          }}
        >
          <Plus className="size-3 pointer-events-none text-text-on-accent hidden group-hover:inline-block" />
          {visible && (
            <NextStepDropdown
              nodeId={nodeId}
              hideModal={() => {
                hideModal()
                clearActiveDropdown()
              }}
            >
              <span></span>
            </NextStepDropdown>
          )}
        </Handle>
      </HandleContext.Provider>
    )
  },
)

CommonHandle.displayName = 'CommonHandle'
