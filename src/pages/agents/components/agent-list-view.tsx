import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Clock,
  Download,
  FilePenLine,
  GitBranch,
  History,
  Trash2,
} from 'lucide-react'
import {
  ResourceListBody,
  ResourceListContainer,
  ResourceListEmpty,
  ResourceListHeader,
  ResourceListRow,
  ResourceListSkeletonRow,
  getAvatarGradient,
} from '@/components/ui/resource-list'
import {
  cn,
  formatRelativeTime,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import {
  countFlowNodes,
  downloadFlowJson,
  isPipelineFlow,
  resolveLocalizedText,
} from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import type { AgentTimeFormat } from './agent-card'

export type { AgentTimeFormat }

interface AgentListViewProps {
  data: AgentFlow[]
  isLoading?: boolean
  timeFormat?: AgentTimeFormat
  onOpen: (flow: AgentFlow) => void
  onDelete: (flow: AgentFlow) => void
  onRename?: (flow: AgentFlow) => void
  onViewLogs?: (flow: AgentFlow) => void
}

const GRID_COLS = 'grid-cols-[2fr_100px_100px_180px_60px]'

const SKELETON_WIDTHS = ['w-14', 'w-10', 'w-28']

const formatTime = (timestamp: number, format: AgentTimeFormat): string => {
  switch (format) {
    case 'detailed':
      return formatTimestampDetailed(timestamp)
    case 'compact':
      return formatTimestampCompact(timestamp)
    case 'relative':
      return formatRelativeTime(timestamp)
    default:
      return formatTimestampDetailed(timestamp)
  }
}

const AgentAvatar: FC<{ name: string; avatar?: string }> = ({
  name,
  avatar,
}) => {
  if (avatar) {
    const src =
      avatar.startsWith('data:') || avatar.startsWith('http')
        ? avatar
        : `data:image/png;base64,${avatar}`
    return (
      <img
        src={src}
        alt={name}
        className="rounded-radius-lg h-12 w-12 object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }
  const gradient = getAvatarGradient(name || 'A')
  return (
    <div
      className={cn(
        'rounded-radius-lg flex h-12 w-12 items-center justify-center',
        'shadow-elevation-low bg-gradient-to-br',
        gradient,
      )}
    >
      <span className="text-xl font-semibold text-white">
        {(name || 'A').charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

const AgentListRow: FC<{
  flow: AgentFlow
  timeFormat: AgentTimeFormat
  onOpen: () => void
  onDelete: () => void
  onRename?: () => void
  onViewLogs?: () => void
}> = ({ flow, timeFormat, onOpen, onDelete, onRename, onViewLogs }) => {
  const { t } = useTranslation()
  const title = resolveLocalizedText(
    flow.title,
    t('agent.unnamedAgent', '未命名 Agent'),
  )
  const description = resolveLocalizedText(flow.description, '')
  const pipeline = isPipelineFlow(flow)
  const nodeCount = countFlowNodes(flow)

  return (
    <ResourceListRow
      onClick={onOpen}
      avatar={<AgentAvatar name={title} avatar={flow.avatar} />}
      name={title}
      description={description || undefined}
      actions={[
        {
          key: 'open',
          label: t('agent.center.openEditor', '打开编辑器'),
          icon: <ArrowRight className="h-4 w-4" />,
          onClick: onOpen,
        },
        {
          key: 'rename',
          label: t('agent.center.rename', '重命名'),
          icon: <FilePenLine className="h-4 w-4" />,
          onClick: onRename || (() => undefined),
        },
        {
          key: 'export-json',
          label: t('agent.center.exportJson', '导出 JSON'),
          icon: <Download className="h-4 w-4" />,
          onClick: () => downloadFlowJson(flow),
        },
        {
          key: 'view-logs',
          label: t('agent.center.viewLogs', '查看运行记录'),
          icon: <History className="h-4 w-4" />,
          onClick: onViewLogs || (() => undefined),
        },
        {
          key: 'delete',
          label: t('agent.center.delete', '删除'),
          icon: <Trash2 className="h-4 w-4" />,
          onClick: onDelete,
          danger: true,
        },
      ]}
      gridCols={GRID_COLS}
    >
      <div className="flex items-center">
        <span
          className={cn(
            'inline-flex items-center truncate rounded-full px-2 py-0.5 text-xs font-medium',
            pipeline
              ? 'bg-background-subtle text-text-secondary'
              : 'bg-status-success-subtle text-status-success',
          )}
        >
          {pipeline
            ? t('agent.pipeline', 'Pipeline')
            : t('agent.agent', 'Agent')}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <GitBranch className="h-3.5 w-3.5 shrink-0" />
        <span>{nodeCount}</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {formatTime(flow.update_time, timeFormat)}
      </div>
    </ResourceListRow>
  )
}

export const AgentListView: FC<AgentListViewProps> = ({
  data,
  isLoading = false,
  timeFormat = 'detailed',
  onOpen,
  onDelete,
  onRename,
  onViewLogs,
}) => {
  const { t } = useTranslation()
  const headerColumns = [
    { key: 'name', label: t('agent.center.name', '名称') },
    { key: 'type', label: t('agent.center.type', '类型') },
    { key: 'nodes', label: t('agent.center.nodes', '节点数') },
    { key: 'update_time', label: t('agent.center.updateTime', '更新时间') },
    { key: 'actions', label: t('agent.center.actions', '操作') },
  ]

  return (
    <ResourceListContainer>
      <ResourceListHeader columns={headerColumns} gridCols={GRID_COLS} />

      <ResourceListBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <ResourceListSkeletonRow
              key={i}
              columnWidths={SKELETON_WIDTHS}
              gridCols={GRID_COLS}
            />
          ))
        ) : data.length === 0 ? (
          <ResourceListEmpty />
        ) : (
          data.map((flow) => (
            <AgentListRow
              key={flow.id}
              flow={flow}
              timeFormat={timeFormat}
              onOpen={() => onOpen(flow)}
              onDelete={() => onDelete(flow)}
              onRename={() => onRename?.(flow)}
              onViewLogs={() => onViewLogs?.(flow)}
            />
          ))
        )}
      </ResourceListBody>
    </ResourceListContainer>
  )
}

AgentListView.displayName = 'AgentListView'
