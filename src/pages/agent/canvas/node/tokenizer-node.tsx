import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Layers } from 'lucide-react'
import { LeftEndHandle } from './handle'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'

// Tokenizer节点 - Pipeline终点，没有output handle
function InnerTokenizerNode({ id, data, selected }: NodeProps) {
  return (
    <NodeWrapper selected={selected}>
      <LeftEndHandle />
      <NodeHeader
        id={id}
        name={data.name as string}
        label={data.label as string}
        icon={<Layers className="w-4 h-4 text-purple-600" />}
      />
      <div className="px-3 py-2">
        <div className="text-xs text-gray-500">
          分词器
        </div>
      </div>
    </NodeWrapper>
  )
}

export const TokenizerNode = memo(InnerTokenizerNode)


