import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { Database } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { useAllMemoryList } from '@/hooks/use-memory'
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
import { EntityAvatar } from '@/components/patterns/entity-avatar'

type RetrievalItem = { id: string; name: string; avatar?: string | null }

function RetrievalSummary({
  itemIds,
  items,
  isMemoryMode,
}: {
  itemIds: string[]
  items: RetrievalItem[]
  isMemoryMode: boolean
}) {
  const { t } = useTranslation()
  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  )
  return (
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
        const item = itemMap.get(itemId)
        const label = item?.name || itemId

        return (
          <div
            key={`${itemId}-${index}`}
            className={cn(
              'flex items-center gap-space-sm px-space-sm py-space-sm',
              withDivider && 'border-t border-border-subtle',
            )}
          >
            <EntityAvatar
              name={label}
              src={item?.avatar ?? undefined}
              seed={itemId}
              size="md"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
              {label}
            </span>
          </div>
        )
      }}
    />
  )
}

function MemoryRetrievalSummary({ itemIds }: { itemIds: string[] }) {
  const query = useAllMemoryList()
  return (
    <RetrievalSummary
      itemIds={itemIds}
      items={query.data?.memory_list ?? []}
      isMemoryMode
    />
  )
}

function DatasetRetrievalSummary({ itemIds }: { itemIds: string[] }) {
  const { knowledgeBases } = useFetchKnowledgeList({ page_size: 1000 })
  return (
    <RetrievalSummary
      itemIds={itemIds}
      items={knowledgeBases}
      isMemoryMode={false}
    />
  )
}

function InnerRetrievalNode({
  id,
  data,
  isConnectable,
  selected,
}: NodeProps<IRetrievalNode>) {
  const form = (data.form ?? {}) as {
    retrieval_from?: string
    memory_ids?: string[]
    dataset_ids?: string[]
    kb_ids?: string[]
  }
  const isMemoryMode = form.retrieval_from === RetrievalFrom.Memory
  const itemIds = isMemoryMode
    ? (form.memory_ids ?? [])
    : (form.dataset_ids ?? form.kb_ids ?? [])

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
          icon={
            <Database
              className="h-4 w-4"
              style={{ color: 'var(--color-components-canvas-icon-retrieval)' }}
            />
          }
        />
        {isMemoryMode ? (
          <MemoryRetrievalSummary itemIds={itemIds} />
        ) : (
          <DatasetRetrievalSummary itemIds={itemIds} />
        )}
      </NodeWrapper>
    </ToolBar>
  )
}

export const RetrievalNode = memo(InnerRetrievalNode)
