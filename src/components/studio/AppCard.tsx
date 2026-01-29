/**
 * 应用卡片组件
 * 用于工作室列表页展示单个应用
 * 参考 MemoryCard 的悬停效果实现
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Sparkles,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { cn, formatRelativeTime, formatTimestampDetailed, formatTimestampCompact } from '@/lib/utils'
import { STUDIO_TEXTS } from '@/constants/studio-texts'
import { ROUTES } from '@/constants'
import type { DialogApp } from '@/types/api'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

interface AppCardProps {
  data: DialogApp
  onEdit?: (app: DialogApp) => void
  onDelete?: (app: DialogApp) => void
  selected?: boolean
  onSelect?: (id: string) => void
  timeFormat?: TimeFormatType
}

// 状态颜色映射 - 使用语义令牌
const statusColors: Record<string, string> = {
  '1': 'bg-components-badge-green-bg text-components-badge-green-text',
  '0': 'bg-components-badge-gray-bg text-components-badge-gray-text',
}

// 状态标签
const statusLabels: Record<string, string> = {
  '1': STUDIO_TEXTS.statusPublished,
  '0': STUDIO_TEXTS.statusDraft,
}

// 根据时间格式返回格式化后的时间
const formatTime = (dateString: string, format: TimeFormatType): string => {
  const timestamp = new Date(dateString).getTime()
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

export const AppCard: React.FC<AppCardProps> = ({
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
    // 跳转到应用配置页面
    const searchParams = new URLSearchParams({
      id: data.id,
      name: data.name,
      description: data.description,
      ...(data.icon && { icon: data.icon })
    })
    navigate(`${ROUTES.STUDIO_CREATE_APP}?${searchParams.toString()}`)
  }

  const handleCheckboxChange = (checked: boolean) => {
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
  const avatarGradient = useMemo(() => {
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

  // 获取应用图标
  const getAppIcon = () => {
    if (data.icon) {
      const iconSrc = data.icon.startsWith('data:') || data.icon.startsWith('http')
        ? data.icon
        : `data:image/png;base64,${data.icon}`
      return (
        <img
          src={iconSrc}
          alt={data.name}
          className="w-12 h-12 rounded-xl object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.classList.remove('hidden')
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
              <Checkbox
                checked={selected}
                onCheckedChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {/* 头像 */}
            <div className="relative">
              {getAppIcon()}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br',
                  avatarGradient,
                  data.icon && 'hidden'
                )}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* 名称和类型 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate">
                {data.name}
              </h3>
              <span className="text-sm text-text-tertiary">
                {STUDIO_TEXTS.app}
              </span>
            </div>
          </div>

          {/* 操作菜单 */}
          <div onClick={(e) => e.stopPropagation()}>
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
                {STUDIO_TEXTS.edit}
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                danger
              >
                {STUDIO_TEXTS.delete}
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* 描述 */}
        {data.description && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* 状态标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge
            variant="secondary"
            className={cn('text-xs', statusColors[data.status] || statusColors['0'])}
          >
            {statusLabels[data.status] || statusLabels['0']}
          </Badge>
          {data.kb_ids && data.kb_ids.length > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-components-badge-blue-bg text-components-badge-blue-text"
            >
              <Database className="w-3 h-3 mr-1" />
              {data.kb_ids.length} {STUDIO_TEXTS.knowledgeBases}
            </Badge>
          )}
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-sm text-text-tertiary">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(data.update_date, timeFormat)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

AppCard.displayName = 'AppCard'
