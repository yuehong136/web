/**
 * 记忆库卡片组件
 * 用于列表页展示单个记忆库
 * 参考 MCP 服务器卡片的悬停效果实现
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { cn, formatRelativeTime, formatTimestampDetailed, formatTimestampCompact } from '@/lib/utils'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import type { Memory, MemoryType } from '@/types/memory'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

interface MemoryCardProps {
  data: Memory
  onEdit?: (memory: Memory) => void
  onDelete?: (memory: Memory) => void
  selected?: boolean
  onSelect?: (id: string) => void
  timeFormat?: TimeFormatType
}

// 记忆类型颜色映射 - 使用 Badge variant
const memoryTypeVariants: Record<MemoryType, 'blue' | 'purple' | 'green' | 'orange'> = {
  raw: 'blue',
  semantic: 'purple',
  episodic: 'green',
  procedural: 'orange',
}

// 记忆类型标签
const memoryTypeLabels: Record<MemoryType, string> = {
  raw: MEMORY_TEXTS.memories.raw,
  semantic: MEMORY_TEXTS.memories.semantic,
  episodic: MEMORY_TEXTS.memories.episodic,
  procedural: MEMORY_TEXTS.memories.procedural,
}


// 根据时间格式返回格式化后的时间
const formatTime = (timestamp: number, format: TimeFormatType): string => {
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

export const MemoryCard: React.FC<MemoryCardProps> = ({
  data,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  timeFormat = 'detailed',
}) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    navigate(`/memory/${data.id}`)
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect?.(data.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(data)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(data)
  }

  // 生成头像背景渐变 - 使用语义令牌
  const avatarGradient = React.useMemo(() => {
    const gradients = [
      'from-components-avatar-gradient-purple-from to-components-avatar-gradient-purple-to',
      'from-components-avatar-gradient-blue-from to-components-avatar-gradient-blue-to',
      'from-components-avatar-gradient-green-from to-components-avatar-gradient-green-to',
      'from-components-avatar-gradient-orange-from to-components-avatar-gradient-orange-to',
      'from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
    ]
    const index = data.name.charCodeAt(0) % gradients.length
    return gradients[index]
  }, [data.name])

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-300 cursor-pointer',
        'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        isHovered && 'ring-2 ring-blue-500/20',
        selected && 'ring-2 ring-text-accent'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered ? 'var(--color-state-focus)' : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* 卡片内容 */}
      <div className="relative p-4 pt-5">
        {/* 头部：头像、名称、操作 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* 选择框 */}
            {onSelect && (
              <input
                type="checkbox"
                className="rounded border-border-default"
                checked={selected}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            {/* 头像 */}
            {data.avatar ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={data.avatar} alt={data.name} />
                <AvatarFallback><Database className="h-5 w-5" /></AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br',
                  avatarGradient
                )}
              >
                <span className="text-white font-bold text-lg">
                  {data.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* 名称和描述 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate">
                {data.name}
              </h3>
              {data.description && (
                <p className="text-sm text-text-secondary truncate">
                  {data.description}
                </p>
              )}
            </div>
          </div>

          {/* 操作菜单 */}
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              trigger={
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownItem
                icon={<Edit className="h-4 w-4" />}
                onClick={handleEdit}
              >
                {MEMORY_TEXTS.common.edit}
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                danger
              >
                {MEMORY_TEXTS.common.delete}
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* 记忆类型标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.memory_type.map((type) => (
            <Badge
              key={type}
              variant={memoryTypeVariants[type]}
              className="text-xs"
            >
              {memoryTypeLabels[type]}
            </Badge>
          ))}
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-sm text-text-tertiary">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{data.memory_size || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(data.create_time, timeFormat)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

MemoryCard.displayName = 'MemoryCard'
