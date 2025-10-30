import type { HandleProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { memo } from 'react'

export const LeftEndHandle = memo(() => {
  return (
    <Handle
      type="target"
      position={Position.Left}
      id="end"  // 关键！必须有这个ID
      isConnectable={false}
      className="!size-2 !bg-blue-500 !border-none group-hover:!size-4 group-hover:!rounded-sm"
      style={{
        left: 0,  // 修复：应该是0，不是-6px
      }}
    />
  )
})

LeftEndHandle.displayName = 'LeftEndHandle'

interface CommonHandleProps extends Omit<HandleProps, 'id'> {
  isConnectableEnd?: boolean
  id: string
}

export const CommonHandle = memo(
  ({ isConnectableEnd = true, ...props }: CommonHandleProps) => {
    return (
      <Handle
        {...props}
        isConnectable={isConnectableEnd && props.isConnectable}
        className="!size-2 !bg-blue-500 !border-none group-hover:!size-4 group-hover:!rounded-sm transition-all"
      />
    )
  },
)

CommonHandle.displayName = 'CommonHandle'

