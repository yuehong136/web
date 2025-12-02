import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { Scissors } from 'lucide-react'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { NodeHandleId } from '../../constant'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'

function InnerSplitterNode({ id, data, isConnectable, selected }: NodeProps) {
  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label as string}
      showRun={needsSingleStepDebugging(data.label as string)}
      showCopy={showCopyIcon(data.label as string)}
    >
      <NodeWrapper selected={selected}>
        <LeftEndHandle />
        <CommonHandle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          id={NodeHandleId.Start}
          style={RightHandleStyle}
          isConnectableEnd={false}
        />
        <NodeHeader
          id={id}
          name={data.name as string}
          label={data.label as string}
          icon={<Scissors className="w-4 h-4 text-orange-600" />}
        />
        <div className="px-3 py-2">
          <div className="text-xs text-gray-500">
            文本分块
          </div>
        </div>
      </NodeWrapper>
    </ToolBar>
  )
}

export const SplitterNode = memo(InnerSplitterNode)


