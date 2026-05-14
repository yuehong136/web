/**
 * 应用卡片组件
 * 用于工作室列表页展示单个应用
 * 参考 MemoryCard 的悬停效果实现
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Database,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { getAvatarGradient } from '@/components/ui/resource-list'
import {
  cn,
  formatRelativeTime,
  formatTimestampDetailed,
  formatTimestampCompact,
} from '@/lib/utils'
import { ROUTES } from '@/constants'
import type { DialogApp } from '@/types/api'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

interface AppCardProps {
  data: DialogApp
  onEdit?: (app: DialogApp) => void
  onDelete?: (app: DialogApp) => void
  onExport?: (app: DialogApp) => void
  selected?: boolean
  onSelect?: (id: string) => void
  timeFormat?: TimeFormatType
}

// 状态颜色映射 - 使用语义令牌
const statusColors: Record<string, string> = {
  '1': 'bg-components-badge-green-bg text-components-badge-green-text',
  '0': 'bg-components-badge-gray-bg text-components-badge-gray-text',
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
  onExport,
  selected = false,
  onSelect,
  timeFormat = 'detailed',
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    // 跳转到应用配置页面
    const searchParams = new URLSearchParams({
      id: data.id,
      name: data.name,
      description: data.description,
      ...(data.icon && { icon: data.icon }),
    })
    navigate(`${ROUTES.STUDIO_CREATE_APP}?${searchParams.toString()}`)
  }

  const handleCheckboxChange = () => {
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

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation()
    onExport?.(data)
  }

  // 获取头像渐变色
  const avatarGradient = useMemo(
    () => getAvatarGradient(data.name),
    [data.name],
  )

  // 获取应用图标
  const getAppIcon = () => {
    if (data.icon) {
      const iconSrc =
        data.icon.startsWith('data:') || data.icon.startsWith('http')
          ? data.icon
          : `data:image/png;base64,${data.icon}`
      return (
        <img
          src={iconSrc}
          alt={data.name}
          className="h-12 w-12 rounded-xl object-cover"
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
        'group relative cursor-pointer rounded-2xl border transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5',
        isHovered && 'ring-2 ring-blue-500/20',
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

            {/* 头像 */}
            <div className="relative">
              {getAppIcon()}
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  'bg-gradient-to-br shadow-sm',
                  avatarGradient,
                  data.icon && 'hidden',
                )}
              >
                <span className="text-xl font-semibold text-white">
                  {data.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* 名称和类型 */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-text-primary">
                {data.name}
              </h3>
              <span className="text-sm text-text-tertiary">
                {t('studio.card.app', '应用')}
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
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownItem
                icon={<Edit className="h-4 w-4" />}
                onClick={handleEdit}
              >
                {t('studio.card.edit', '编辑')}
              </DropdownItem>
              <DropdownItem
                icon={<Download className="h-4 w-4" />}
                onClick={handleExport}
              >
                {t('studio.card.exportTemplate', '导出模版')}
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                danger
              >
                {t('studio.card.delete', '删除')}
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* 描述 */}
        {data.description && (
          <p className="mb-3 line-clamp-2 text-sm text-text-secondary">
            {data.description}
          </p>
        )}

        {/* 状态标签 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              statusColors[data.status] || statusColors['0'],
            )}
          >
            {data.status === '1'
              ? t('studio.filters.published', '已发布')
              : t('studio.filters.draft', '草稿')}
          </Badge>
          {data.kb_ids && data.kb_ids.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-components-badge-blue-bg text-xs text-components-badge-blue-text"
            >
              <Database className="mr-1 h-3 w-3" />
              {data.kb_ids.length} {t('studio.card.knowledgeBases', '知识库')}
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
