import { Position } from '@xyflow/react'
import { useContext, useMemo, type MouseEventHandler } from 'react'
import { PencilLine, Wrench, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { AgentInstanceContext } from '../../context'
import { Operator } from '../../constant'
import OperatorIcon from '../../operator-icon'
import useGraphStore from '../../store'
import type { INextOperatorForm, RAGFlowNodeType } from '../../types'
import { useFindMcpById } from '../../hooks/use-find-mcp-by-id'
import { useAgentToolActions, useAgentToolState, useSyncAgentToolNode } from './tool-hooks'
import { AgentToolPopover } from './tool-popover'
import { filterDownstreamAgentNodeIds } from '../../utils/filter-downstream-nodes'

interface ToolRowProps {
  toolId: string
  title: string
  icon?: React.ReactNode
  onEdit?: MouseEventHandler<HTMLButtonElement>
  onRemove: () => void
  editDisabledReason?: string
}

function ToolRow({
  toolId,
  title,
  icon,
  onEdit,
  onRemove,
  editDisabledReason,
}: ToolRowProps) {
  const editButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-tool-id={toolId}
      onClick={onEdit}
      disabled={!onEdit}
    >
      <PencilLine className="pointer-events-none size-4" />
    </Button>
  )

  return (
    <div className="flex items-center justify-between rounded-radius-md border border-border-default bg-surface-secondary/40 px-space-sm py-space-sm">
      <div className="flex min-w-0 items-center gap-space-sm">
        {icon}
        <span className="truncate text-sm text-text-primary">{title}</span>
      </div>
      <div className="flex items-center gap-space-xs">
        {editDisabledReason ? (
          <Tooltip content={<p>{editDisabledReason}</p>}>
            <span>{editButton}</span>
          </Tooltip>
        ) : (
          editButton
        )}
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <X className="pointer-events-none size-4" />
        </Button>
      </div>
    </div>
  )
}

interface AgentToolsProps {
  node?: RAGFlowNodeType
}

export function AgentTools({ node }: AgentToolsProps) {
  const { t } = useTranslation()
  const { showFormDrawer } = useContext(AgentInstanceContext)
  const { tools, mcp } = useAgentToolState(node)
  const { removeTool, removeMcp } = useAgentToolActions(node)
  const toolNodeId = useSyncAgentToolNode(node)
  const { findMcpById } = useFindMcpById()
  const selectNodeIds = useGraphStore((state) => state.selectNodeIds)

  const isEmpty = tools.length === 0 && mcp.length === 0

  const handleEdit = useMemo(
    () =>
      (event: Parameters<MouseEventHandler<HTMLButtonElement>>[0]) => {
        if (!toolNodeId) {
          return
        }

        selectNodeIds([toolNodeId])
        showFormDrawer?.(event, toolNodeId)
      },
    [selectNodeIds, showFormDrawer, toolNodeId],
  )

  return (
    <section className="space-y-space-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          {t('flow.tools', 'Tools')}
        </span>
      </div>

      {isEmpty ? (
        <div className="rounded-radius-md border border-dashed border-border-default px-space-sm py-space-sm text-sm text-text-secondary">
          {t('flow.noToolsSelected', 'No tools selected yet.')}
        </div>
      ) : (
        <div className="space-y-space-sm">
          {tools.map((tool) => (
            <ToolRow
              key={tool.id}
              toolId={tool.id}
              title={tool.name || tool.component_name}
              icon={<OperatorIcon name={tool.component_name as never} />}
              onEdit={
                tool.component_name === Operator.Code ? undefined : handleEdit
              }
              editDisabledReason={
                tool.component_name === Operator.Code
                  ? t('flow.toolNoConfig', "It doesn't have any config.")
                  : undefined
              }
              onRemove={() => removeTool(tool.id)}
            />
          ))}

          {mcp.map((item) => (
            <ToolRow
              key={item.mcp_id}
              toolId={item.mcp_id}
              title={findMcpById(item.mcp_id)?.name || item.mcp_id}
              icon={<Wrench className="size-4 text-text-secondary" />}
              onEdit={handleEdit}
              onRemove={() => removeMcp(item.mcp_id)}
            />
          ))}
        </div>
      )}

      <AgentToolPopover node={node} />
    </section>
  )
}

export function Agents({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const { addCanvasNode, showFormDrawer } = useContext(AgentInstanceContext)
  const { edges, getNode, selectNodeIds, deleteAgentDownstreamNodesById } =
    useGraphStore((state) => state)

  const subAgentIds = useMemo(
    () => filterDownstreamAgentNodeIds(edges, node?.id),
    [edges, node?.id],
  )

  const handleEdit = useMemo(
    () =>
      (nodeId: string) =>
      (event: Parameters<MouseEventHandler<HTMLButtonElement>>[0]) => {
        selectNodeIds([nodeId])
        showFormDrawer?.(event, nodeId)
      },
    [selectNodeIds, showFormDrawer],
  )

  return (
    <section className="space-y-space-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          {t('flow.agent', 'Agent')}
        </span>
      </div>

      {subAgentIds.length === 0 ? (
        <div className="rounded-radius-md border border-dashed border-border-default px-space-sm py-space-sm text-sm text-text-secondary">
          {t('flow.noAgentsSelected', 'No sub-agents yet.')}
        </div>
      ) : (
        <div className="space-y-space-sm">
          {subAgentIds.map((id) => (
            <ToolRow
              key={id}
              toolId={id}
              title={getNode(id)?.data?.name || id}
              icon={<OperatorIcon name={Operator.Agent} />}
              onEdit={handleEdit(id)}
              onRemove={() => deleteAgentDownstreamNodesById(id)}
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={addCanvasNode?.(Operator.Agent, {
          nodeId: node?.id,
          position: Position.Bottom,
        })}
      >
        {t('flow.addAgent', 'Add Agent')}
      </Button>
    </section>
  )
}
