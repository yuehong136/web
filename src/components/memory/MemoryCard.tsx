/**
 * 记忆库卡片组件
 * 用于列表页展示单个记忆库
 * 参考 MCP 服务器卡片的悬停效果实现
 */

import { useState, type FC, type KeyboardEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MoreVertical, Edit, Trash2, MessageSquare, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import {
  cn,
  formatRelativeTime,
  formatTimestampDetailed,
  formatTimestampCompact,
} from '@/lib/utils'
import type { Memory, MemoryType } from '@/types/memory'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

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
const memoryTypeVariants: Record<
  MemoryType,
  'blue' | 'purple' | 'green' | 'orange'
> = {
  raw: 'blue',
  semantic: 'purple',
  episodic: 'green',
  procedural: 'orange',
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

export const MemoryCard: FC<MemoryCardProps> = ({
  data,
  onEdit,
  onDelete,
  selected = false,
  onSelect,
  timeFormat = 'detailed',
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    navigate(`/memory/${data.id}`)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const handleCheckboxChange = () => {
    onSelect?.(data.id)
  }

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation()
    onEdit?.(data)
  }

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation()
    onDelete?.(data)
  }

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-2xl border transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5',
        isHovered && 'ring-2 ring-text-accent/20',
        selected && 'ring-2 ring-text-accent',
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
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {/* 卡片内容 */}
      <div className="relative p-4 pt-5">
        {/* 头部：头像、名称、操作 */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* 选择框 */}
            {onSelect && (
              <Checkbox
                checked={selected}
                onCheckedChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            <EntityAvatar
              name={data.name}
              src={data.avatar}
              seed={data.id}
              size="xl"
            />

            {/* 名称和描述 */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-text-primary">
                {data.name}
              </h3>
              {data.description && (
                <p className="truncate text-sm text-text-secondary">
                  {data.description}
                </p>
              )}
            </div>
          </div>

          {/* 操作菜单 */}
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
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
                {t('common.edit')}
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                danger
              >
                {t('common.delete')}
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* 记忆类型标签 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {data.memory_type.map((type) => (
            <Badge
              key={type}
              variant={memoryTypeVariants[type]}
              className="text-xs"
            >
              {t(`memory.filters.${type}`, type)}
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
