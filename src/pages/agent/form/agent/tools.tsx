import { Position } from '@xyflow/react'
import { useContext, useMemo, type MouseEventHandler } from 'react'
import { PencilLine, Plus, Wrench, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { LabelCard } from '../../canvas/node/card'
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
      size="icon-sm"
      data-tool-id={toolId}
      data-tool={toolId}
      onClick={onEdit}
      disabled={!onEdit}
      className="size-4 rounded-radius-sm bg-transparent p-0 text-text-secondary hover:text-text-primary"
    >
      <PencilLine className="pointer-events-none size-full" />
    </Button>
  )

  return (
    <li>
      <LabelCard className="flex items-center justify-between p-space-sm text-sm text-text-primary">
        <div className="flex min-w-0 items-center gap-space-sm">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-space-md text-text-secondary">
          {editDisabledReason ? (
            <Tooltip content={<p>{editDisabledReason}</p>}>
              <span>{editButton}</span>
            </Tooltip>
          ) : (
            editButton
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-4 rounded-radius-sm bg-transparent p-0 text-text-secondary hover:text-text-primary"
            onClick={onRemove}
          >
            <X className="pointer-events-none size-full" />
          </Button>
        </div>
      </LabelCard>
    </li>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-text-secondary">{children}</span>
}

function DashedActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-dashed border-border-default"
      onClick={onClick}
    >
      <Plus className="size-4" />
      {children}
    </Button>
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
      <SectionTitle>{t('flow.tools', 'Tools')}</SectionTitle>

      {!isEmpty && (
        <ul className="space-y-space-sm">
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
        </ul>
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
      <SectionTitle>{t('flow.agent', 'Agent')}</SectionTitle>

      {subAgentIds.length > 0 && (
        <ul className="space-y-space-sm">
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
        </ul>
      )}

      <DashedActionButton
        onClick={addCanvasNode?.(Operator.Agent, {
          nodeId: node?.id,
          position: Position.Bottom,
        })}
      >
        {t('flow.addAgent', 'Add Agent')}
      </DashedActionButton>
    </section>
  )
}
