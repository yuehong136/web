import React from 'react'
import { ArrowRight, Clock, GitBranch, Trash2 } from 'lucide-react'
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
import { countFlowNodes, isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import type { AgentTimeFormat } from './agent-card'

export type { AgentTimeFormat }

interface AgentListViewProps {
  data: AgentFlow[]
  isLoading?: boolean
  timeFormat?: AgentTimeFormat
  onOpen: (flow: AgentFlow) => void
  onDelete: (flow: AgentFlow) => void
}

const GRID_COLS = 'grid-cols-[2fr_100px_100px_180px_60px]'

const HEADER_COLUMNS = [
  { key: 'name', label: '名称' },
  { key: 'type', label: '类型' },
  { key: 'nodes', label: '节点数' },
  { key: 'update_time', label: '更新时间' },
  { key: 'actions', label: '操作' },
]

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

const AgentAvatar: React.FC<{ name: string; avatar?: string }> = ({ name, avatar }) => {
  if (avatar) {
    const src =
      avatar.startsWith('data:') || avatar.startsWith('http')
        ? avatar
        : `data:image/png;base64,${avatar}`
    return (
      <img
        src={src}
        alt={name}
        className="h-12 w-12 rounded-radius-lg object-cover"
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
        'flex h-12 w-12 items-center justify-center rounded-radius-lg',
        'bg-gradient-to-br shadow-elevation-low',
        gradient,
      )}
    >
      <span className="text-xl font-semibold text-white">
        {(name || 'A').charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

const AgentListRow: React.FC<{
  flow: AgentFlow
  timeFormat: AgentTimeFormat
  onOpen: () => void
  onDelete: () => void
}> = ({ flow, timeFormat, onOpen, onDelete }) => {
  const title = resolveLocalizedText(flow.title, '未命名智能体')
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
          label: '打开编辑器',
          icon: <ArrowRight className="h-4 w-4" />,
          onClick: onOpen,
        },
        {
          key: 'delete',
          label: '删除',
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
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium truncate',
            pipeline
              ? 'text-text-secondary bg-background-subtle'
              : 'text-state-success bg-state-success-subtle',
          )}
        >
          {pipeline ? 'Pipeline' : 'Agent'}
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

export const AgentListView: React.FC<AgentListViewProps> = ({
  data,
  isLoading = false,
  timeFormat = 'detailed',
  onOpen,
  onDelete,
}) => {
  return (
    <ResourceListContainer>
      <ResourceListHeader columns={HEADER_COLUMNS} gridCols={GRID_COLS} />

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
            />
          ))
        )}
      </ResourceListBody>
    </ResourceListContainer>
  )
}

AgentListView.displayName = 'AgentListView'
