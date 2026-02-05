import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { Sparkles } from 'lucide-react'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { NodeHandleId } from '../../constant'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'

// Extractor节点（contextNode）
function InnerExtractorNode({ id, data, isConnectable, selected }: NodeProps) {
  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label as string}
      showRun={needsSingleStepDebugging(data.label as string)}
      showCopy={showCopyIcon(data.label as string)}
    >
      <NodeWrapper selected={selected} id={id}>
        <LeftEndHandle />
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
          icon={<Sparkles className="w-4 h-4" style={{ color: 'var(--color-components-canvas-icon-extractor)' }} />}
        />
        <div className="px-3 py-2">
          <div className="text-xs text-text-tertiary">
            内容提取
          </div>
        </div>
      </NodeWrapper>
    </ToolBar>
  )
}

export const ExtractorNode = memo(InnerExtractorNode)
