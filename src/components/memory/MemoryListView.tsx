/**
 * 记忆库列表视图组件
 * 使用通用 ResourceListRow 组件，整行可点击进入、悬停高亮
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Edit, Trash2, Database, User, Users, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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
import type { Memory, MemoryType } from '@/types/memory'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

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

// Grid 布局：名称 | 记忆类型 | 存储类型 | 权限 | 创建时间 | 更新时间 | 操作
const GRID_COLS = 'grid-cols-[2fr_1fr_100px_90px_150px_150px_60px]'

// 骨架屏列宽度
const SKELETON_WIDTHS = ['w-24', 'w-14', 'w-12', 'w-28', 'w-28']

// 记忆类型颜色
const memoryTypeVariants: Record<
  MemoryType,
  'blue' | 'purple' | 'green' | 'orange'
> = {
  raw: 'blue',
  semantic: 'purple',
  episodic: 'green',
  procedural: 'orange',
}

// 时间格式化
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

// 记忆库头像
const MemoryAvatar: React.FC<{ memory: Memory }> = ({ memory }) => {
  const gradient = getAvatarGradient(memory.name)

  if (memory.avatar) {
    return (
      <Avatar className="h-12 w-12">
        <AvatarImage src={memory.avatar} alt={memory.name} />
        <AvatarFallback>
          <Database className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
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
        {memory.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

// 列表行组件
const MemoryListRow: React.FC<{
  memory: Memory
  selected: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  timeFormat: TimeFormatType
}> = ({ memory, selected, onSelect, onEdit, onDelete, timeFormat }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/memory/${memory.id}`)
  }

  const actions = []
  if (onEdit) {
    actions.push({
      key: 'edit',
      label: t('common.edit', '编辑'),
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
    })
  }
  if (onDelete) {
    actions.push({
      key: 'delete',
      label: t('common.delete', '删除'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      danger: true,
    })
  }

  return (
    <ResourceListRow
      onClick={handleClick}
      selected={selected}
      onSelect={onSelect}
      avatar={<MemoryAvatar memory={memory} />}
      name={memory.name}
      description={memory.description || undefined}
      actions={actions}
      gridCols={GRID_COLS}
    >
      {/* 记忆类型列 */}
      <div className="flex flex-wrap gap-1">
        {memory.memory_type.map((type) => (
          <Badge
            key={type}
            variant={memoryTypeVariants[type]}
            className="px-1.5 py-0 text-xs"
          >
            {t(`memory.filters.${type}`, type)}
          </Badge>
        ))}
      </div>

      {/* 存储类型列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        {memory.storage_type === 'graph' ? (
          <>
            <Layers className="h-3.5 w-3.5" />
            <span>{t('memory.fields.graph', '图')}</span>
          </>
        ) : (
          <>
            <Database className="h-3.5 w-3.5" />
            <span>{t('memory.fields.table', '表格')}</span>
          </>
        )}
      </div>

      {/* 权限列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        {memory.permissions === 'me' ? (
          <>
            <User className="h-3.5 w-3.5" />
            <span>{t('memory.fields.onlyMe', '仅自己')}</span>
          </>
        ) : (
          <>
            <Users className="h-3.5 w-3.5" />
            <span>{t('memory.fields.team', '团队')}</span>
          </>
        )}
      </div>

      {/* 创建时间列 */}
      <div className="text-sm text-text-tertiary">
        {formatTime(memory.create_time, timeFormat)}
      </div>

      {/* 更新时间列 */}
      <div className="text-sm text-text-tertiary">
        {memory.update_time ? formatTime(memory.update_time, timeFormat) : '-'}
      </div>
    </ResourceListRow>
  )
}

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
  const { t } = useTranslation()
  const allSelected = data.length > 0 && selectedIds.length === data.length
  const headerColumns = [
    { key: 'name', label: t('memory.fields.name', '名称') },
    { key: 'memory_type', label: t('memory.filters.memoryType', '记忆类型') },
    { key: 'storage_type', label: t('memory.fields.storageType', '存储类型') },
    { key: 'permissions', label: t('memory.fields.permission', '权限') },
    { key: 'create_time', label: t('memory.fields.createdAt', '创建时间') },
    { key: 'update_time', label: t('memory.fields.updatedAt', '更新时间') },
    { key: 'actions', label: t('common.action', '操作') },
  ]

  return (
    <ResourceListContainer>
      {/* 表头 */}
      <ResourceListHeader
        columns={headerColumns}
        allSelected={allSelected}
        onSelectAll={onSelectAll}
        showSelect={!!onSelect}
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
          data.map((memory) => (
            <MemoryListRow
              key={memory.id}
              memory={memory}
              selected={selectedIds.includes(memory.id)}
              onSelect={onSelect ? () => onSelect(memory.id) : undefined}
              onEdit={onEdit ? () => onEdit(memory) : undefined}
              onDelete={onDelete ? () => onDelete(memory) : undefined}
              timeFormat={timeFormat}
            />
          ))
        )}
      </ResourceListBody>
    </ResourceListContainer>
  )
}

MemoryListView.displayName = 'MemoryListView'
