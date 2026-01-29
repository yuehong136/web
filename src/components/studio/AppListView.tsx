/**
 * 应用列表视图组件
 * 用于工作室页面的表格展示模式
 * 参考 KnowledgeListPage 的 renderTableView 实现
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Eye,
  Settings,
  Trash2,
  Clock,
  Sparkles,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { cn, formatRelativeTime, formatTimestampDetailed, formatTimestampCompact } from '@/lib/utils'
import { STUDIO_TEXTS } from '@/constants/studio-texts'
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

// 状态颜色映射
const getStatusColor = (status: string) => {
  if (status === '1') {
    return 'text-text-success bg-[var(--color-state-success-10)]'
  }
  return 'text-text-secondary bg-background-subtle'
}

// 状态标签
const getStatusText = (status: string) => {
  return status === '1' ? STUDIO_TEXTS.statusPublished : STUDIO_TEXTS.statusDraft
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
  const navigate = useNavigate()

  const handleView = (app: DialogApp) => {
    const searchParams = new URLSearchParams({
      id: app.id,
      name: app.name,
      description: app.description,
      ...(app.icon && { icon: app.icon })
    })
    navigate(`${ROUTES.STUDIO_CREATE_APP}?${searchParams.toString()}`)
  }

  // 生成头像背景渐变
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

  // 获取应用图标
  const getAppIcon = (app: DialogApp) => {
    if (app.icon) {
      const iconSrc = app.icon.startsWith('data:') || app.icon.startsWith('http')
        ? app.icon
        : `data:image/png;base64,${app.icon}`
      return (
        <img
          src={iconSrc}
          alt={app.name}
          className="w-8 h-8 rounded-lg object-cover"
        />
      )
    }
    return (
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'bg-gradient-to-br',
          getAvatarGradient(app.name)
        )}
      >
        <Sparkles className="w-4 h-4 text-white" />
      </div>
    )
  }

  const columns = [
    {
      key: 'select',
      title: (
        <Checkbox
          checked={selectedIds.length === data.length && data.length > 0}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectAll(data.map(app => app.id))
            } else {
              onSelectAll([])
            }
          }}
        />
      ),
      render: (_: unknown, record: DialogApp) => (
        <Checkbox
          checked={selectedIds.includes(record.id)}
          onCheckedChange={() => onSelect(record.id)}
        />
      ),
    },
    {
      key: 'name',
      dataIndex: 'name',
      title: '名称',
      render: (value: string, record: DialogApp) => (
        <div className="flex items-center gap-3">
          {getAppIcon(record)}
          <div>
            <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {value}
            </div>
            <div className="text-sm max-w-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
              {record.description || '暂无描述'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      dataIndex: 'status',
      title: '状态',
      render: (value: string) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
          getStatusColor(value)
        )}>
          {getStatusText(value)}
        </span>
      ),
    },
    {
      key: 'kb_ids',
      dataIndex: 'kb_ids',
      title: '知识库',
      render: (value: string[] | undefined) => (
        <div className="flex items-center text-text-secondary">
          <Database className="h-4 w-4 mr-1 text-text-tertiary" />
          {value?.length || 0}
        </div>
      ),
    },
    {
      key: 'create_date',
      dataIndex: 'create_date',
      title: '创建时间',
      render: (value: string) => (
        <div className="flex items-center text-text-secondary">
          <Clock className="h-4 w-4 mr-1 text-text-tertiary" />
          {formatTime(value, timeFormat)}
        </div>
      ),
    },
    {
      key: 'update_date',
      dataIndex: 'update_date',
      title: '更新时间',
      render: (value: string) => (
        <div className="flex items-center text-text-secondary">
          <Clock className="h-4 w-4 mr-1 text-text-tertiary" />
          {formatTime(value, timeFormat)}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: unknown, record: DialogApp) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleView(record)}
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Dropdown
            trigger={
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          >
            <DropdownItem
              icon={<Settings className="h-4 w-4" />}
              onClick={() => onEdit(record)}
            >
              {STUDIO_TEXTS.settings}
            </DropdownItem>
            <DropdownItem
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => onDelete(record)}
              danger
            >
              {STUDIO_TEXTS.delete}
            </DropdownItem>
          </Dropdown>
        </div>
      ),
    },
  ]

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: 'var(--color-components-card-border)',
      }}
    >
      <Table
        columns={columns}
        data={data}
        loading={isLoading}
      />
    </div>
  )
}

AppListView.displayName = 'AppListView'
