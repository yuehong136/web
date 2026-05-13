import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Clock,
  Download,
  Edit,
  FilePenLine,
  GitBranch,
  History,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { getAvatarGradient } from '@/components/ui/resource-list'
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

export type AgentTimeFormat = 'detailed' | 'compact' | 'relative'

interface AgentCardProps {
  flow: AgentFlow
  onOpen: (flow: AgentFlow) => void
  onDelete: (flow: AgentFlow) => void
  onRename?: (flow: AgentFlow) => void
  onViewLogs?: (flow: AgentFlow) => void
  timeFormat?: AgentTimeFormat
}

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

export function AgentCard({
  flow,
  onOpen,
  onDelete,
  onRename,
  onViewLogs,
  timeFormat = 'detailed',
}: AgentCardProps) {
  const { t } = useTranslation()
  const title = resolveLocalizedText(
    flow.title,
    t('agent.unnamedAgent', '未命名 Agent'),
  )
  const description = resolveLocalizedText(flow.description, '')
  const pipeline = isPipelineFlow(flow)
  const nodeCount = countFlowNodes(flow)
  const avatarGradient = getAvatarGradient(title)

  const handleEdit = (event: MouseEvent) => {
    event.stopPropagation()
    onOpen(flow)
  }

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation()
    onDelete(flow)
  }

  const handleRename = (event: MouseEvent) => {
    event.stopPropagation()
    onRename?.(flow)
  }

  const handleExport = (event: MouseEvent) => {
    event.stopPropagation()
    downloadFlowJson(flow)
  }

  const handleViewLogs = (event: MouseEvent) => {
    event.stopPropagation()
    onViewLogs?.(flow)
  }

  const renderAvatar = () => {
    if (flow.avatar) {
      const src =
        flow.avatar.startsWith('data:') || flow.avatar.startsWith('http')
          ? flow.avatar
          : `data:image/png;base64,${flow.avatar}`
      return (
        <img
          src={src}
          alt={title}
          className="h-12 w-12 rounded-xl object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
            event.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }
    return null
  }

  return (
    <div
      className={cn(
        'rounded-radius-xl shadow-elevation-low group relative border border-components-card-border bg-components-card-bg transition-all duration-300',
        'hover:shadow-elevation-medium hover:-translate-y-0.5 hover:border-state-focus',
      )}
    >
      <div className="right-space-sm top-space-sm absolute z-10">
        <Dropdown
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
        >
          <DropdownItem
            icon={<Edit className="h-4 w-4" />}
            onClick={handleEdit}
          >
            {t('agent.center.openEditor', '打开编辑器')}
          </DropdownItem>
          <DropdownItem
            icon={<FilePenLine className="h-4 w-4" />}
            onClick={handleRename}
          >
            {t('agent.center.rename', '重命名')}
          </DropdownItem>
          <DropdownItem
            icon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            {t('agent.center.exportJson', '导出 JSON')}
          </DropdownItem>
          <DropdownItem
            icon={<History className="h-4 w-4" />}
            onClick={handleViewLogs}
          >
            {t('agent.center.viewLogs', '查看运行记录')}
          </DropdownItem>
          <div className="my-1 border-t border-border-subtle" />
          <DropdownItem
            icon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
            danger
          >
            {t('agent.center.delete', '删除')}
          </DropdownItem>
        </Dropdown>
      </div>
      <button
        type="button"
        className="block w-full cursor-pointer text-left"
        onClick={() => onOpen(flow)}
      >
        <div className="relative p-4 pt-5">
          <div className="pr-space-xl mb-3 flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative">
                {renderAvatar()}
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    'shadow-elevation-low bg-gradient-to-br',
                    avatarGradient,
                    flow.avatar && 'hidden',
                  )}
                >
                  <span className="text-xl font-semibold text-white">
                    {title.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-text-primary">
                  {title}
                </h3>
                <span className="text-sm text-text-tertiary">
                  {pipeline
                    ? t('agent.pipeline', 'Pipeline')
                    : t('agent.agent', 'Agent')}
                </span>
              </div>
            </div>
          </div>

          {description ? (
            <p className="mb-3 line-clamp-2 min-h-[40px] text-sm text-text-secondary">
              {description}
            </p>
          ) : (
            <div className="mb-3 min-h-[40px]" />
          )}

          <div className="mb-3 flex flex-wrap gap-1.5">
            <Badge variant={pipeline ? 'blue' : 'green'} className="text-xs">
              {pipeline
                ? t('agent.pipeline', 'Pipeline')
                : t('agent.agent', 'Agent')}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <GitBranch className="mr-1 h-3 w-3" />
              {t('agents.nodeCount', '{{count}} 节点', { count: nodeCount })}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm text-text-tertiary">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(flow.update_time, timeFormat)}</span>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}
