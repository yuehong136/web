/**
 * 智能体卡片组件
 * 风格参照知识库卡片 (KnowledgeCard)，保持一致的布局和交互
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { Workflow, Clock, MoreVertical, Settings, Trash2, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn, formatTimestampDetailed, formatTimestampCompact, formatRelativeTime } from '@/lib/utils'
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
  _onRename,
  _onDuplicate,
  timeFormat = 'detailed'
}) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = React.useState(false)

  // 处理多语言标题
  const title = typeof agent.title === 'object'
    ? (agent.title.zh || agent.title.en || '未命名')
    : (agent.title || '未命名')

  // 处理多语言描述
  const description = typeof agent.description === 'object'
    ? (agent.description.zh || agent.description.en)
    : agent.description

  // 判断类型
  const isPlugin = agent.canvas_type === 'pipeline' || agent.canvas_category === 'Ingestion'

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
      return 'text-text-success bg-[var(--color-state-success-10)]'
    } else {
      return 'text-text-accent bg-[var(--color-state-info-10)]'
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
    navigate(`/agent/${agent.id}`)
  }

  const handleSettings = () => {
    navigate(`/agent/${agent.id}`)
  }

  const handleDelete = () => {
    onDelete(agent.id)
  }

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-300 cursor-pointer',
        'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        isHovered && 'ring-2 ring-blue-500/20'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered ? 'var(--color-state-focus)' : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
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
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-sm',
                  gradient
                )}
              >
                <span className="text-white font-semibold text-lg">
                  {title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {title}
              </h3>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                getStatusColor()
              )}>
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

        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {description || '暂无描述'}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          <div className="flex items-center">
            <Layers className="h-4 w-4 mr-1.5" />
            {nodeCount} 节点
          </div>
          <div className="flex items-center">
            <Workflow className="h-4 w-4 mr-1.5" />
            {isPlugin ? 'Pipeline' : '智能体'}
          </div>
          <div className="flex items-center col-span-2">
            <Clock className="h-4 w-4 mr-1.5" />
            {formatTime(agent.update_time)}
          </div>
        </div>
      </div>
    </div>
  )
}

AgentCard.displayName = 'AgentCard'

