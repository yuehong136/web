import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IMessageNode } from '../../types'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { NodeHandleId } from '../../constant'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { useGetVariableLabelOrTypeByValue } from '../../hooks/use-get-begin-query'
import { LabelCard } from './card'
import { SummaryList } from './summary-list'
import { VariableDisplay } from './variable-display'

function InnerMessageNode({ id, data, isConnectable, selected }: NodeProps<IMessageNode>) {
  const messages = Array.isArray(data.form?.content)
    ? data.form.content
    : []
  const { getLabel } = useGetVariableLabelOrTypeByValue({ nodeId: id })

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
          icon={<MessageSquare className="w-4 h-4" style={{ color: 'var(--color-components-canvas-icon-message)' }} />}
        />
        <SummaryList
          items={messages}
          empty={<LabelCard>暂无内容</LabelCard>}
          renderItem={(message, index, { withDivider }) => (
            <section
              key={`${id}-message-${index}`}
              className={cn(withDivider && 'border-t border-border-subtle pt-space-sm')}
            >
              <LabelCard>
                <VariableDisplay content={message} getLabel={getLabel} />
              </LabelCard>
            </section>
          )}
        />
      </NodeWrapper>
    </ToolBar>
  )
}

export const MessageNode = memo(InnerMessageNode)
