import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { Database } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { KnowledgeBaseAvatar } from '@/components/knowledge'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { useMemoryList } from '@/hooks/use-memory'
import { cn } from '@/lib/utils'
import { NodeHandleId, RetrievalFrom } from '../../constant'
import type { IRetrievalNode } from '../../types'
import { CommonHandle, LeftEndHandle } from './handle'
import { RightHandleStyle } from './handle-icon'
import { LabelCard } from './card'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { SummaryList } from './summary-list'
import { ToolBar } from './toolbar'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'

function InnerRetrievalNode({
  id,
  data,
  isConnectable,
  selected,
}: NodeProps<IRetrievalNode>) {
  const { t } = useTranslation()
  const { knowledgeBases } = useFetchKnowledgeList({ page_size: 1000 })
  const memoryQuery = useMemoryList({ page_size: 1000 })
  const form = (data.form ?? {}) as {
    retrieval_from?: string
    memory_ids?: string[]
    kb_ids?: string[]
  }
  const isMemoryMode = form.retrieval_from === RetrievalFrom.Memory
  const itemIds = isMemoryMode
    ? (form.memory_ids ?? [])
    : (form.kb_ids ?? [])
  const knowledgeMap = useMemo(
    () => new Map(knowledgeBases.map((item) => [item.id, item])),
    [knowledgeBases],
  )
  const memoryMap = useMemo(
    () =>
      new Map(
        (memoryQuery.data?.memory_list ?? []).map((item) => [item.id, item]),
      ),
    [memoryQuery.data?.memory_list],
  )

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
        <SummaryList
          items={itemIds}
          empty={
            <LabelCard>
              {isMemoryMode
                ? t('flow.selectMemories', 'Select memories')
                : t('flow.selectKnowledgeBases', 'Select datasets')}
            </LabelCard>
          }
          renderItem={(itemId, index, { withDivider }) => {
            const item = isMemoryMode
              ? memoryMap.get(itemId)
              : knowledgeMap.get(itemId)
            const label = item?.name || itemId

            return (
              <div
                key={`${itemId}-${index}`}
                className={cn(
                  'flex items-center gap-space-sm px-space-sm py-space-sm',
                  withDivider && 'border-t border-border-subtle',
                )}
              >
                <KnowledgeBaseAvatar
                  name={label}
                  avatar={item?.avatar}
                  size="lg"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                  {label}
                </span>
              </div>
            )
          }}
        />
      </NodeWrapper>
    </ToolBar>
  )
}

export const RetrievalNode = memo(InnerRetrievalNode)
