/**
 * 记忆库列表视图组件
 * 现代化的表格风格，清晰展示各属性列
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Edit,
  Trash2,
  Database,
  User,
  Users,
  ChevronRight,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { Checkbox } from '@/components/ui/checkbox'
import { cn, formatRelativeTime, formatTimestampDetailed, formatTimestampCompact } from '@/lib/utils'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import type { Memory, MemoryType } from '@/types/memory'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

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

interface MemoryListViewProps {
  data: Memory[]
  onEdit?: (memory: Memory) => void
  onDelete?: (memory: Memory) => void
  selectedIds?: string[]
  onSelect?: (id: string) => void
  onSelectAll?: () => void
  isLoading?: boolean
  timeFormat?: TimeFormatType
}

// 记忆类型颜色映射 - 使用语义令牌
const memoryTypeColors: Record<MemoryType, string> = {
  raw: 'bg-components-badge-blue-bg text-components-badge-blue-text',
  semantic: 'bg-components-badge-purple-bg text-components-badge-purple-text',
  episodic: 'bg-components-badge-green-bg text-components-badge-green-text',
  procedural: 'bg-components-badge-orange-bg text-components-badge-orange-text',
}

// 记忆类型标签
const memoryTypeLabels: Record<MemoryType, string> = {
  raw: MEMORY_TEXTS.memories.raw,
  semantic: MEMORY_TEXTS.memories.semantic,
  episodic: MEMORY_TEXTS.memories.episodic,
  procedural: MEMORY_TEXTS.memories.procedural,
}

// 生成头像背景渐变 - 使用语义令牌
const getAvatarGradient = (name: string) => {
  const gradients = [
    'from-components-avatar-gradient-purple-from to-components-avatar-gradient-purple-to',
    'from-components-avatar-gradient-blue-from to-components-avatar-gradient-blue-to',
    'from-components-avatar-gradient-green-from to-components-avatar-gradient-green-to',
    'from-components-avatar-gradient-orange-from to-components-avatar-gradient-orange-to',
    'from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
  ]
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

// 列表行组件
const MemoryListRow: React.FC<{
  data: Memory
  onEdit?: (memory: Memory) => void
  onDelete?: (memory: Memory) => void
  selected?: boolean
  onSelect?: (id: string) => void
  timeFormat?: TimeFormatType
}> = ({ data, onEdit, onDelete, selected, onSelect, timeFormat = 'detailed' }) => {
  const navigate = useNavigate()
  const avatarGradient = getAvatarGradient(data.name)

  const handleClick = () => {
    navigate(`/memory/${data.id}`)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(data)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(data)
  }

  return (
    <div
      className={cn(
        'group relative grid grid-cols-[2fr_1fr_100px_90px_150px_150px_60px] items-center gap-4',
        'px-5 h-[72px] rounded-xl cursor-pointer',
        'border-2 border-transparent',
        'transition-all duration-200 ease-out',
        // 悬停效果
        'hover:bg-surface-secondary/80 hover:border-border-default hover:shadow-md',
        // 选中效果：左侧彩色边框 + 背景色 + 轻微阴影
        selected && [
          'bg-gradient-to-r from-text-accent/5 to-transparent',
          'border-l-text-accent border-l-4',
          'shadow-sm',
        ]
      )}
      onClick={handleClick}
    >
      {/* 名称列 */}
      <div className="flex items-center gap-4 min-w-0">
        {onSelect && (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelect(data.id)}
              className="transition-transform duration-150 hover:scale-110"
            />
          </div>
        )}
        
        {/* 头像 - 放大并添加悬停效果 */}
        {data.avatar ? (
          <Avatar className="h-10 w-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
            <AvatarImage src={data.avatar} alt={data.name} />
            <AvatarFallback><Database className="h-5 w-5" /></AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
              'bg-gradient-to-br shadow-md',
              'transition-transform duration-200 group-hover:scale-105',
              avatarGradient
            )}
          >
            <span className="text-white font-bold text-base">
              {data.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* 名称和描述 - 固定高度保证行高一致 */}
        <div className="flex-1 min-w-0 h-11 flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <h3 
              className="font-medium text-text-primary truncate group-hover:text-text-accent transition-colors duration-200"
              title={data.name}
            >
              {data.name}
            </h3>
            <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
          </div>
          {data.description && (
            <p 
              className="text-sm text-text-tertiary truncate mt-0.5"
              title={data.description}
            >
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* 记忆类型列 */}
      <div className="flex flex-wrap gap-1">
        {data.memory_type.map((type) => (
          <Badge
            key={type}
            variant="secondary"
            className={cn('text-xs px-1.5 py-0', memoryTypeColors[type])}
          >
            {memoryTypeLabels[type]}
          </Badge>
        ))}
      </div>

      {/* 存储类型列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        {data.storage_type === 'graph' ? (
          <>
            <Layers className="h-3.5 w-3.5" />
            <span>{MEMORY_TEXTS.config.graph}</span>
          </>
        ) : (
          <>
            <Database className="h-3.5 w-3.5" />
            <span>{MEMORY_TEXTS.config.table}</span>
          </>
        )}
      </div>

      {/* 权限列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        {data.permissions === 'me' ? (
          <>
            <User className="h-3.5 w-3.5" />
            <span>{MEMORY_TEXTS.config.onlyMe}</span>
          </>
        ) : (
          <>
            <Users className="h-3.5 w-3.5" />
            <span>{MEMORY_TEXTS.config.team}</span>
          </>
        )}
      </div>

      {/* 创建时间列 */}
      <div className="text-sm text-text-tertiary">
        {formatTime(data.create_time, timeFormat)}
      </div>

      {/* 更新时间列 */}
      <div className="text-sm text-text-tertiary">
        {data.update_time ? formatTime(data.update_time, timeFormat) : '-'}
      </div>

      {/* 操作列 */}
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
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
  )
}

// 骨架屏行
const SkeletonRow: React.FC = () => (
  <div className="grid grid-cols-[2fr_1fr_100px_90px_150px_150px_60px] items-center gap-4 px-5 h-[72px]">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-surface-secondary animate-pulse" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
        <div className="h-3 w-48 bg-surface-secondary rounded animate-pulse" />
      </div>
    </div>
    <div className="flex gap-1.5">
      <div className="h-5 w-12 bg-surface-secondary rounded-full animate-pulse" />
      <div className="h-5 w-12 bg-surface-secondary rounded-full animate-pulse" />
    </div>
    <div className="h-4 w-14 bg-surface-secondary rounded animate-pulse" />
    <div className="h-4 w-12 bg-surface-secondary rounded animate-pulse" />
    <div className="h-4 w-28 bg-surface-secondary rounded animate-pulse" />
    <div className="h-4 w-28 bg-surface-secondary rounded animate-pulse" />
    <div />
  </div>
)

export const MemoryListView: React.FC<MemoryListViewProps> = ({
  data,
  onEdit,
  onDelete,
  selectedIds = [],
  onSelect,
  onSelectAll,
  isLoading = false,
  timeFormat = 'detailed',
}) => {
  const allSelected = data.length > 0 && selectedIds.length === data.length

  return (
    <div className="w-full">
      {/* 表头 */}
      <div className="grid grid-cols-[2fr_1fr_100px_90px_150px_150px_60px] items-center gap-4 px-5 h-12 border-b border-border-default bg-surface-secondary/50">
        <div className="flex items-center gap-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {onSelect && (
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
            />
          )}
          <span>{MEMORY_TEXTS.memories.name}</span>
        </div>
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {MEMORY_TEXTS.memories.memoryType}
        </div>
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {MEMORY_TEXTS.config.storageType}
        </div>
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {MEMORY_TEXTS.config.permission}
        </div>
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          创建时间
        </div>
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          更新时间
        </div>
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
          操作
        </div>
      </div>

      {/* 列表内容 */}
      <div className="divide-y divide-border-subtle">
        {isLoading ? (
          // 加载骨架屏
          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
        ) : (
          data.map((memory) => (
            <MemoryListRow
              key={memory.id}
              data={memory}
              onEdit={onEdit}
              onDelete={onDelete}
              selected={selectedIds.includes(memory.id)}
              onSelect={onSelect}
              timeFormat={timeFormat}
            />
          ))
        )}
      </div>

      {/* 空状态 */}
      {!isLoading && data.length === 0 && (
        <div className="py-12 text-center text-text-tertiary">
          暂无数据
        </div>
      )}
    </div>
  )
}

MemoryListView.displayName = 'MemoryListView'
