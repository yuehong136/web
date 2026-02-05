import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { Database } from 'lucide-react'
import type { IRetrievalNode } from '../../types'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { NodeHandleId } from '../../constant'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'

function InnerRetrievalNode({ id, data, isConnectable, selected }: NodeProps<IRetrievalNode>) {
  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
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
          name={data.name}
          label={data.label}
          icon={<Database className="w-4 h-4" style={{ color: 'var(--color-components-canvas-icon-retrieval)' }} />}
        />
        <div className="px-3 py-2">
          <div className="text-xs text-text-tertiary space-y-0.5">
            <div>Top N: {data.form?.top_n || 8}</div>
            <div>知识库: {data.form?.kb_ids?.length || 0} 个</div>
          </div>
        </div>
      </NodeWrapper>
    </ToolBar>
  )
}

export const RetrievalNode = memo(InnerRetrievalNode)
