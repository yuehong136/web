/**
 * 记忆库卡片组件
 * 用于列表页展示单个记忆库
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  Database,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { cn, formatRelativeTime } from '@/lib/utils'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import type { Memory, MemoryType } from '@/types/memory'

interface MemoryCardProps {
  data: Memory
  onEdit?: (memory: Memory) => void
  onDelete?: (memory: Memory) => void
  selected?: boolean
  onSelect?: (id: string) => void
}

// 记忆类型颜色映射
const memoryTypeColors: Record<MemoryType, string> = {
  raw: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  semantic: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  episodic: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  procedural: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
}

// 记忆类型标签
const memoryTypeLabels: Record<MemoryType, string> = {
  raw: MEMORY_TEXTS.memories.raw,
  semantic: MEMORY_TEXTS.memories.semantic,
  episodic: MEMORY_TEXTS.memories.episodic,
  procedural: MEMORY_TEXTS.memories.procedural,
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  data,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
}) => {
  const navigate = useNavigate()

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

  // 生成头像背景渐变
  const avatarGradient = React.useMemo(() => {
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ]
    const index = data.name.charCodeAt(0) % gradients.length
    return gradients[index]
  }, [data.name])

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-300 ease-out',
        'hover:shadow-xl hover:-translate-y-1.5 hover:border-text-accent/30',
        'border border-border-default bg-surface-primary',
        'group relative overflow-hidden',
        selected && 'ring-2 ring-text-accent border-text-accent'
      )}
      onClick={handleClick}
    >
      {/* 渐变装饰条 */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        'bg-gradient-to-r',
        avatarGradient
      )} />
      <CardContent className="p-4 pt-5">
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
              variant="secondary"
              className={cn('text-xs', memoryTypeColors[type])}
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
            <span>{formatRelativeTime(data.create_time)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

MemoryCard.displayName = 'MemoryCard'
