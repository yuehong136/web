import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Wrench } from 'lucide-react'
import { LeftEndHandle } from './handle'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'

// Tool节点只有input handle，没有output handle
function InnerToolNode({ id, data, selected }: NodeProps) {
  return (
    <NodeWrapper selected={selected} className="!border-gray-400">
      {/* 只有左侧的target handle */}
      <LeftEndHandle />
      
      <NodeHeader
        id={id}
        name={data.name as string}
        label={data.label as string}
        icon={<Wrench className="w-4 h-4 text-gray-600" />}
      />
      
      <div className="px-3 py-2">
        <div className="text-xs text-gray-500 line-clamp-2">
          {(data.form as any)?.description || 'Tool节点'}
        </div>
      </div>
    </NodeWrapper>
  )
}

export const ToolNode = memo(InnerToolNode)
