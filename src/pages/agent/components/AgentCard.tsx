/**
 * 智能体卡片组件
 * 风格参照知识库卡片 (KnowledgeCard)，保持一致的布局和交互
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { buildAgentCanvasPath, isPipelineFlow } from '@/lib/agent'
import {
  Workflow,
  Clock,
  MoreVertical,
  Settings,
  Trash2,
  Layers,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  cn,
  formatTimestampDetailed,
  formatTimestampCompact,
  formatRelativeTime,
} from '@/lib/utils'
import type { IFlow } from '../types'

interface AgentCardProps {
  agent: IFlow
  onDelete: (id: string) => void
  onRename?: (id: string, currentName: string) => void
  _onRename?: (id: string, currentName: string) => void
  onDuplicate?: (id: string) => void
  _onDuplicate?: (id: string) => void
  timeFormat?: 'detailed' | 'compact' | 'relative'
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onDelete,
  timeFormat = 'detailed',
}) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = React.useState(false)

  // 处理多语言标题
  const title =
    typeof agent.title === 'object'
      ? agent.title.zh || agent.title.en || '未命名'
      : agent.title || '未命名'

  // 处理多语言描述
  const description =
    typeof agent.description === 'object'
      ? agent.description.zh || agent.description.en
      : agent.description

  // 判断类型
  const isPlugin = isPipelineFlow(agent)

  // 获取头像渐变色
  const gradient = getAvatarGradient(title)

  // 获取节点数量
  const nodeCount = agent.dsl?.graph?.nodes?.length || 0

  // 格式化时间
  const formatTime = (timestamp: number) => {
    switch (timeFormat) {
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

  // 获取状态颜色和文字
  const getStatusColor = () => {
    if (nodeCount > 1) {
      return 'text-text-success bg-[var(--color-status-success-10)]'
    } else {
      return 'text-text-accent bg-[var(--color-status-info-10)]'
    }
  }

  const getStatusText = () => {
    if (nodeCount > 1) {
      return isPlugin ? 'Pipeline' : '智能体'
    } else {
      return '空流程'
    }
  }

  const handleClick = () => {
    navigate(buildAgentCanvasPath(agent.id, agent))
  }

  const handleSettings = () => {
    navigate(buildAgentCanvasPath(agent.id, agent))
  }

  const handleDelete = () => {
    onDelete(agent.id)
  }

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-2xl border transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5',
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
      onClick={handleClick}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex flex-1 items-center gap-3">
            {agent.avatar ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={agent.avatar} alt={title} />
                <AvatarFallback>
                  <Workflow className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  'bg-gradient-to-br shadow-sm',
                  gradient,
                )}
              >
                <span className="text-lg font-semibold text-white">
                  {title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3
                className="truncate font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  getStatusColor(),
                )}
              >
                {getStatusText()}
              </span>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              trigger={
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownItem
                icon={<Settings className="h-4 w-4" />}
                onClick={handleSettings}
              >
                编辑
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

        <p
          className="mb-4 line-clamp-2 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {description || '暂无描述'}
        </p>

        <div
          className="grid grid-cols-2 gap-3 text-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <div className="flex items-center">
            <Layers className="mr-1.5 h-4 w-4" />
            {nodeCount} 节点
          </div>
          <div className="flex items-center">
            <Workflow className="mr-1.5 h-4 w-4" />
            {isPlugin ? 'Pipeline' : '智能体'}
          </div>
          <div className="col-span-2 flex items-center">
            <Clock className="mr-1.5 h-4 w-4" />
            {formatTime(agent.update_time)}
          </div>
        </div>
      </div>
    </div>
  )
}

AgentCard.displayName = 'AgentCard'
