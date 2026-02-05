import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { FileUp } from 'lucide-react'
import { CommonHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { NodeHandleId } from '../../constant'

// File节点 - Pipeline的起点（类似Begin）
function InnerFileNode({ id, data, isConnectable, selected }: NodeProps) {
  return (
    <NodeWrapper selected={selected} id={id}>
      <CommonHandle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        id={NodeHandleId.Start}
        style={RightHandleStyle}
        isConnectableEnd={false}
        nodeId={id}
      />
      <NodeHeader
        id={id}
        name={data.name as string}
        label={data.label as string}
        icon={<FileUp className="w-4 h-4" style={{ color: 'var(--color-components-canvas-icon-file)' }} />}
      />
      <div className="px-3 py-2">
        <div className="text-xs text-text-tertiary">
          文件输入
        </div>
      </div>
    </NodeWrapper>
  )
}

export const FileNode = memo(InnerFileNode)
