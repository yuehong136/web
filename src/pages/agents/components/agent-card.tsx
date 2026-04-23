import React, { useState } from 'react'
import {
  Clock,
  Edit,
  GitBranch,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dropdown,
  DropdownItem,
} from '@/components/ui/dropdown'
import { getAvatarGradient } from '@/components/ui/resource-list'
import {
  cn,
  formatRelativeTime,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import { countFlowNodes, isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'

export type AgentTimeFormat = 'detailed' | 'compact' | 'relative'

interface AgentCardProps {
  flow: AgentFlow
  onOpen: (flow: AgentFlow) => void
  onDelete: (flow: AgentFlow) => void
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
  timeFormat = 'detailed',
}: AgentCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const title = resolveLocalizedText(flow.title, '未命名智能体')
  const description = resolveLocalizedText(flow.description, '')
  const pipeline = isPipelineFlow(flow)
  const nodeCount = countFlowNodes(flow)
  const avatarGradient = getAvatarGradient(title)

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation()
    onOpen(flow)
  }

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    onDelete(flow)
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
        'group relative rounded-2xl border transition-all duration-300 cursor-pointer',
        'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        isHovered && 'ring-2 ring-blue-500/20',
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered
          ? 'var(--color-state-focus)'
          : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(flow)}
    >
      <div className="relative p-4 pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              {renderAvatar()}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-sm',
                  avatarGradient,
                  flow.avatar && 'hidden',
                )}
              >
                <span className="text-white font-semibold text-xl">
                  {title.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate">
                {title}
              </h3>
              <span className="text-sm text-text-tertiary">
                {pipeline ? 'Pipeline' : 'Agent'}
              </span>
            </div>
          </div>

          <div onClick={(event) => event.stopPropagation()}>
            <Dropdown
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownItem
                icon={<Edit className="h-4 w-4" />}
                onClick={handleEdit}
              >
                打开编辑器
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                danger
              >
                删除
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {description ? (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2 min-h-[40px]">
            {description}
          </p>
        ) : (
          <div className="min-h-[40px] mb-3" />
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge
            variant={pipeline ? 'blue' : 'green'}
            className="text-xs"
          >
            {pipeline ? 'Pipeline' : 'Agent'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <GitBranch className="w-3 h-3 mr-1" />
            {nodeCount} 节点
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm text-text-tertiary">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(flow.update_time, timeFormat)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
