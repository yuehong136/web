import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { IMessageNode } from '../../types'
import { LeftEndHandle } from './handle'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import { useGetVariableLabelOrTypeByValue } from '../../hooks/use-get-begin-query'
import { LabelCard } from './card'
import { SummaryList } from './summary-list'
import { VariableDisplay } from './variable-display'

function InnerMessageNode({ id, data, selected }: NodeProps<IMessageNode>) {
  const { t } = useTranslation()
  const messages = Array.isArray(data.form?.content) ? data.form.content : []
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
        <LeftEndHandle nodeId={id} />
        <NodeHeader
          id={id}
          name={data.name}
          label={data.label}
          icon={
            <MessageSquare
              className="h-4 w-4"
              style={{ color: 'var(--color-components-canvas-icon-message)' }}
            />
          }
        />
        <SummaryList
          items={messages}
          empty={<LabelCard>{t('flow.noContent', 'No content')}</LabelCard>}
          renderItem={(message, index, { withDivider }) => (
            <section
              key={`${id}-message-${index}`}
              className={cn(
                withDivider && 'pt-space-sm border-t border-border-subtle',
              )}
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
