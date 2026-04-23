import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import get from 'lodash/get.js'
import { memo } from 'react'
import type { ICategorizeNode } from '../../types'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { LabelCard, LLMLabelCard } from './card'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-icon'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { useBuildCategorizeHandlePositions } from './use-build-categorize-handle-positions'

function InnerCategorizeNode({
  id,
  data,
  selected,
}: NodeProps<ICategorizeNode>) {
  const { positions } = useBuildCategorizeHandlePositions({ data, id })

  return (
    <ToolBar selected={selected} id={id} label={data.label} showRun={needsSingleStepDebugging(data.label)} showCopy={showCopyIcon(data.label)}>
      <NodeWrapper selected={selected} id={id}>
        <LeftEndHandle nodeId={id} />
        <NodeHeader id={id} name={data.name} label={data.label} />
        <section className="flex flex-col gap-space-sm">
          <LLMLabelCard llmId={get(data, 'form.llm_id')} />
          {positions.map((position) => (
            <div key={position.uuid}>
              <LabelCard>{position.name}</LabelCard>
              <CommonHandle
                id={position.uuid}
                type="source"
                position={Position.Right}
                isConnectable
                style={{ ...RightHandleStyle, top: position.top }}
                isConnectableEnd={false}
                nodeId={id}
              />
            </div>
          ))}
        </section>
      </NodeWrapper>
    </ToolBar>
  )
}

export const CategorizeNode = memo(InnerCategorizeNode)
