/**
 * 应用列表视图组件
 * 用于工作室页面的表格展示模式
 * 使用通用 ResourceListRow 组件，整行可点击进入、悬停高亮
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings, Trash2, Clock, Database } from 'lucide-react'
import {
  ResourceListContainer,
  ResourceListHeader,
  ResourceListBody,
  ResourceListRow,
  ResourceListSkeletonRow,
  ResourceListEmpty,
  getAvatarGradient,
} from '@/components/ui/resource-list'
import {
  cn,
  formatRelativeTime,
  formatTimestampDetailed,
  formatTimestampCompact,
} from '@/lib/utils'
import { ROUTES } from '@/constants'
import type { DialogApp } from '@/types/api'
import type { TimeFormatType } from './AppCard'

interface AppListViewProps {
  data: DialogApp[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onEdit: (app: DialogApp) => void
  onDelete: (app: DialogApp) => void
  isLoading?: boolean
  timeFormat?: TimeFormatType
}

// Grid 布局：名称 | 状态 | 知识库 | 创建时间 | 更新时间 | 操作
const GRID_COLS = 'grid-cols-[2fr_90px_80px_150px_150px_60px]'

// 骨架屏列宽度
const SKELETON_WIDTHS = ['w-14', 'w-8', 'w-28', 'w-28']

// 状态颜色
const getStatusColor = (status: string) =>
  status === '1'
    ? 'text-text-success bg-[var(--color-state-success-10)]'
    : 'text-text-secondary bg-background-subtle'

// 时间格式化
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

// 应用图标
const AppAvatar: React.FC<{ app: DialogApp }> = ({ app }) => {
  const gradient = getAvatarGradient(app.name)

  if (app.icon) {
    const iconSrc =
      app.icon.startsWith('data:') || app.icon.startsWith('http')
        ? app.icon
        : `data:image/png;base64,${app.icon}`
    return (
      <img
        src={iconSrc}
        alt={app.name}
        className="h-12 w-12 rounded-xl object-cover"
        onError={(e) => {
          // 图片加载失败时隐藏
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-xl',
        'bg-gradient-to-br shadow-sm',
        gradient,
      )}
    >
      <span className="text-xl font-semibold text-white">
        {app.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

// 列表行组件
const AppListRow: React.FC<{
  app: DialogApp
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  timeFormat: TimeFormatType
}> = ({ app, selected, onSelect, onEdit, onDelete, timeFormat }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleClick = () => {
    const searchParams = new URLSearchParams({
      id: app.id,
      name: app.name,
      description: app.description,
      ...(app.icon && { icon: app.icon }),
    })
    navigate(`${ROUTES.STUDIO_CREATE_APP}?${searchParams.toString()}`)
  }

  return (
    <ResourceListRow
      onClick={handleClick}
      selected={selected}
      onSelect={onSelect}
      avatar={<AppAvatar app={app} />}
      name={app.name}
      description={app.description || undefined}
      actions={[
        {
          key: 'settings',
          label: t('studio.card.settings', '设置'),
          icon: <Settings className="h-4 w-4" />,
          onClick: onEdit,
        },
        {
          key: 'delete',
          label: t('studio.card.delete', '删除'),
          icon: <Trash2 className="h-4 w-4" />,
          onClick: onDelete,
          danger: true,
        },
      ]}
      gridCols={GRID_COLS}
    >
      {/* 状态列 */}
      <div className="flex items-center">
        <span
          className={cn(
            'inline-flex items-center truncate rounded-full px-2 py-0.5 text-xs font-medium',
            getStatusColor(app.status),
          )}
        >
          {app.status === '1'
            ? t('studio.filters.published', '已发布')
            : t('studio.filters.draft', '草稿')}
        </span>
      </div>

      {/* 知识库列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Database className="h-3.5 w-3.5 shrink-0" />
        <span>{app.kb_ids?.length || 0}</span>
      </div>

      {/* 创建时间列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {formatTime(app.create_date, timeFormat)}
      </div>

      {/* 更新时间列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {formatTime(app.update_date, timeFormat)}
      </div>
    </ResourceListRow>
  )
}

export const AppListView: React.FC<AppListViewProps> = ({
  data,
  selectedIds,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  isLoading = false,
  timeFormat = 'detailed',
}) => {
  const { t } = useTranslation()
  const allSelected = data.length > 0 && selectedIds.length === data.length
  const headerColumns = [
    { key: 'name', label: t('common.name', '名称') },
    { key: 'status', label: t('common.status', '状态') },
    { key: 'kb_ids', label: t('studio.card.knowledgeBases', '知识库') },
    { key: 'create_date', label: t('common.createTime', '创建时间') },
    { key: 'update_date', label: t('common.updateTime', '更新时间') },
    { key: 'actions', label: t('common.action', '操作') },
  ]

  return (
    <ResourceListContainer>
      {/* 表头 */}
      <ResourceListHeader
        columns={headerColumns}
        allSelected={allSelected}
        onSelectAll={() => {
          if (allSelected) {
            onSelectAll([])
          } else {
            onSelectAll(data.map((app) => app.id))
          }
        }}
        gridCols={GRID_COLS}
      />

      {/* 列表内容 */}
      <ResourceListBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <ResourceListSkeletonRow
              key={i}
              columnWidths={SKELETON_WIDTHS}
              gridCols={GRID_COLS}
            />
          ))
        ) : data.length === 0 ? (
          <ResourceListEmpty />
        ) : (
          data.map((app) => (
            <AppListRow
              key={app.id}
              app={app}
              selected={selectedIds.includes(app.id)}
              onSelect={() => onSelect(app.id)}
              onEdit={() => onEdit(app)}
              onDelete={() => onDelete(app)}
              timeFormat={timeFormat}
            />
          ))
        )}
      </ResourceListBody>
    </ResourceListContainer>
  )
}

AppListView.displayName = 'AppListView'
