import { memo, useMemo, type MouseEventHandler } from 'react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { NodeHandleId, Operator } from '../../constant'
import { useFindMcpById } from '../../hooks/use-find-mcp-by-id'
import OperatorIcon from '../../operator-icon'
import useGraphStore from '../../store'
import { LabelCard } from './card'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { SummaryList } from './summary-list'

type AgentToolRecord = {
  component_name: string
  id?: string
  name?: string
}

type AgentMcpRecord = {
  mcp_id: string
}

type ToolSummaryItem =
  | {
      kind: 'tool'
      id: string
      operator: string
      title: string
      disabled: boolean
    }
  | {
      kind: 'mcp'
      id: string
      title: string
    }

function InnerToolNode({ id, data, selected }: NodeProps) {
  const { t } = useTranslation()
  const { edges, getNode, setClickedToolId } = useGraphStore((state) => state)
  const { findMcpById } = useFindMcpById()
  const upstreamAgentNodeId = useMemo(
    () => edges.find((edge) => edge.target === id)?.source,
    [edges, id],
  )
  const upstreamAgentNode = getNode(upstreamAgentNodeId)
  const items = useMemo<ToolSummaryItem[]>(
    () => {
      const tools = Array.isArray(upstreamAgentNode?.data?.form?.tools)
        ? (upstreamAgentNode.data.form.tools as AgentToolRecord[])
        : []
      const mcpList = Array.isArray(upstreamAgentNode?.data?.form?.mcp)
        ? (upstreamAgentNode.data.form.mcp as AgentMcpRecord[])
        : []

      return [
        ...tools.map((tool) => ({
        kind: 'tool' as const,
        id: tool.id || tool.component_name,
        operator: tool.component_name,
        title:
          tool.component_name === Operator.Retrieval
            ? tool.name || tool.component_name
            : tool.component_name,
        disabled: tool.component_name === Operator.Code,
        })),
        ...mcpList.map((item) => ({
        kind: 'mcp' as const,
        id: item.mcp_id,
        title: findMcpById(item.mcp_id)?.name || item.mcp_id,
        })),
      ]
    },
    [findMcpById, upstreamAgentNode?.data?.form?.mcp, upstreamAgentNode?.data?.form?.tools],
  )

  const handleItemClick =
    (item: ToolSummaryItem): MouseEventHandler<HTMLElement> =>
    (event) => {
      if (item.kind === 'tool' && item.disabled) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      setClickedToolId(item.id)
    }

  return (
    <NodeWrapper selected={selected} id={id}>
      <Handle
        id={NodeHandleId.End}
        type="target"
        position={Position.Top}
        isConnectable
        className="!size-2 !border-none !bg-components-canvas-handle-bg"
      />
      <NodeHeader
        id={id}
        name={data.name as string}
        label={data.label as string}
        icon={
          <Wrench
            className="size-4"
            style={{ color: 'var(--color-components-canvas-icon-tool)' }}
          />
        }
      />
      <SummaryList
        items={items}
        empty={
          <LabelCard>{t('flow.noToolsSelected', 'No tools selected yet.')}</LabelCard>
        }
        renderItem={(item, index, { withDivider }) => (
          <button
            key={`${item.kind}-${item.id}-${index}`}
            type="button"
            onClick={handleItemClick(item)}
            data-tool-id={item.id}
            data-tool={item.kind === 'tool' ? item.operator : undefined}
            className={cn(
              'flex w-full items-center gap-space-sm px-space-sm py-space-sm text-left transition-colors',
              withDivider && 'border-t border-border-subtle',
              item.kind === 'tool' && item.disabled
                ? 'cursor-default opacity-70'
                : 'cursor-pointer hover:bg-surface-secondary/40',
            )}
          >
            <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-space-sm">
              {item.kind === 'tool' ? (
                <OperatorIcon name={item.operator as Operator} />
              ) : (
                <Wrench className="size-4 text-text-secondary" />
              )}
              <span className="truncate text-sm text-text-primary">
                {item.title}
              </span>
            </div>
          </button>
        )}
      />
    </NodeWrapper>
  )
}

export const ToolNode = memo(InnerToolNode)
