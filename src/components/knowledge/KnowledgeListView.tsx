/**
 * 知识库列表视图组件
 * 使用通用 ResourceListRow 组件，整行可点击进入、悬停高亮
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Trash2, Database, FileText, Clock, Layers, Target } from 'lucide-react'
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
import { cn, formatTimestampDetailed, formatTimestampCompact, formatRelativeTime } from '@/lib/utils'
import { ROUTES } from '@/constants'
import type { KnowledgeBase } from '@/types/api'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

export interface KnowledgeListViewProps {
  data: KnowledgeBase[]
  onEdit?: (kb: KnowledgeBase) => void
  onDelete?: (kb: KnowledgeBase) => void
  selectedIds?: string[]
  onSelect?: (id: string) => void
  onSelectAll?: () => void
  isLoading?: boolean
  timeFormat?: TimeFormatType
  getStatusColor: (kb: KnowledgeBase) => string
  getStatusText: (kb: KnowledgeBase) => string
}

// Grid 布局：名称 | 状态 | 文档数 | 块数 | Token | 更新时间 | 操作
const GRID_COLS = 'grid-cols-[2fr_90px_80px_80px_100px_150px_60px]'

// 表头列配置
const HEADER_COLUMNS = [
  { key: 'name', label: '名称' },
  { key: 'status', label: '状态' },
  { key: 'doc_num', label: '文档数' },
  { key: 'chunk_num', label: '块数' },
  { key: 'token_num', label: 'Token' },
  { key: 'update_time', label: '更新时间' },
  { key: 'actions', label: '操作' },
]

// 骨架屏列宽度
const SKELETON_WIDTHS = ['w-14', 'w-8', 'w-8', 'w-12', 'w-28']

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

// 知识库头像
const KnowledgeAvatar: React.FC<{ kb: KnowledgeBase }> = ({ kb }) => {
  const gradient = getAvatarGradient(kb.name)

  if (kb.avatar) {
    return (
      <Avatar className="h-12 w-12">
        <AvatarImage src={kb.avatar} alt={kb.name} />
        <AvatarFallback>
          <Database className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <div
      className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center',
        'bg-gradient-to-br shadow-sm',
        gradient
      )}
    >
      <span className="text-white font-semibold text-xl">
        {kb.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

// 列表行组件
const KnowledgeListRow: React.FC<{
  kb: KnowledgeBase
  selected: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  timeFormat: TimeFormatType
  getStatusColor: (kb: KnowledgeBase) => string
  getStatusText: (kb: KnowledgeBase) => string
}> = ({ kb, selected, onSelect, onEdit, onDelete, timeFormat, getStatusColor, getStatusText }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`${ROUTES.KNOWLEDGE}/${kb.id}`)
  }

  const actions = []
  if (onEdit) {
    actions.push({
      key: 'settings',
      label: '设置',
      icon: <Settings className="h-4 w-4" />,
      onClick: onEdit,
    })
  }
  if (onDelete) {
    actions.push({
      key: 'delete',
      label: '删除',
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
      avatar={<KnowledgeAvatar kb={kb} />}
      name={kb.name}
      description={kb.description || undefined}
      actions={actions}
      gridCols={GRID_COLS}
    >
      {/* 状态列 */}
      <div className="flex items-center">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium truncate',
            getStatusColor(kb)
          )}
        >
          {getStatusText(kb)}
        </span>
      </div>

      {/* 文档数列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <FileText className="h-3.5 w-3.5 shrink-0" />
        <span>{kb.doc_num ?? 0}</span>
      </div>

      {/* 块数列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Layers className="h-3.5 w-3.5 shrink-0" />
        <span>{kb.chunk_num ?? 0}</span>
      </div>

      {/* Token 列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Target className="h-3.5 w-3.5 shrink-0" />
        <span>{(kb.token_num ?? 0).toLocaleString()}</span>
      </div>

      {/* 更新时间列 */}
      <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {kb.update_time ? formatTime(kb.update_time, timeFormat) : '-'}
      </div>
    </ResourceListRow>
  )
}

export const KnowledgeListView: React.FC<KnowledgeListViewProps> = ({
  data,
  onEdit,
  onDelete,
  selectedIds = [],
  onSelect,
  onSelectAll,
  isLoading = false,
  timeFormat = 'detailed',
  getStatusColor,
  getStatusText,
}) => {
  const allSelected = data.length > 0 && selectedIds.length === data.length

  return (
    <ResourceListContainer>
      {/* 表头 */}
      <ResourceListHeader
        columns={HEADER_COLUMNS}
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
          data.map((kb) => (
            <KnowledgeListRow
              key={kb.id}
              kb={kb}
              selected={selectedIds.includes(kb.id)}
              onSelect={onSelect ? () => onSelect(kb.id) : undefined}
              onEdit={onEdit ? () => onEdit(kb) : undefined}
              onDelete={onDelete ? () => onDelete(kb) : undefined}
              timeFormat={timeFormat}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          ))
        )}
      </ResourceListBody>
    </ResourceListContainer>
  )
}

KnowledgeListView.displayName = 'KnowledgeListView'
