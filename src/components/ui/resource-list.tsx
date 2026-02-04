/**
 * 通用资源列表组件
 * 提供统一的列表行交互：整行点击进入、悬停高亮、选中状态、操作下拉
 * 用于记忆库、知识库、工作室等页面的列表视图
 */

import React, { memo } from 'react'
import { ChevronRight, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义
// ============================================================================

export interface ResourceAction {
  key: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}

export interface ResourceListRowProps {
  /** 整行点击事件 */
  onClick: () => void
  /** 是否选中 */
  selected?: boolean
  /** 选择切换 */
  onSelect?: () => void
  /** 头像渲染 */
  avatar: React.ReactNode
  /** 名称 */
  name: string
  /** 描述（可选，无则不渲染） */
  description?: string | null
  /** 中间列内容 */
  children: React.ReactNode
  /** 操作菜单 */
  actions: ResourceAction[]
  /** 自定义 grid 列布局 */
  gridCols?: string
  /** 自定义类名 */
  className?: string
}

export interface ResourceListHeaderProps {
  /** 表头列 */
  columns: { key: string; label: string; align?: 'left' | 'center' | 'right' }[]
  /** 是否全选 */
  allSelected?: boolean
  /** 全选切换 */
  onSelectAll?: () => void
  /** 是否显示选择框 */
  showSelect?: boolean
  /** 自定义 grid 列布局 */
  gridCols?: string
}

export interface ResourceListContainerProps {
  children: React.ReactNode
  className?: string
}

export interface ResourceListSkeletonRowProps {
  /** 骨架屏列配置：宽度数组 */
  columnWidths?: string[]
  /** 自定义 grid 列布局 */
  gridCols?: string
}

// ============================================================================
// 常量
// ============================================================================

/** 默认的头像渐变色 */
export const AVATAR_GRADIENTS = [
  'from-components-avatar-gradient-purple-from to-components-avatar-gradient-purple-to',
  'from-components-avatar-gradient-blue-from to-components-avatar-gradient-blue-to',
  'from-components-avatar-gradient-green-from to-components-avatar-gradient-green-to',
  'from-components-avatar-gradient-orange-from to-components-avatar-gradient-orange-to',
  'from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
]

/** 根据名称获取头像渐变色 */
export const getAvatarGradient = (name: string): string => {
  const index = name.charCodeAt(0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[index]
}

// ============================================================================
// 子组件
// ============================================================================

/**
 * 资源列表容器
 * 现代化设计：容器内有 padding，行与边框有间距，行可以有圆角
 */
export const ResourceListContainer: React.FC<ResourceListContainerProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'w-full bg-surface-primary rounded-xl border border-border-default',
      className
    )}
  >
    {children}
  </div>
)

/**
 * 资源列表表头
 */
export const ResourceListHeader: React.FC<ResourceListHeaderProps> = memo(({
  columns,
  allSelected,
  onSelectAll,
  showSelect = true,
  gridCols = 'grid-cols-[2fr_repeat(5,1fr)_60px]',
}) => (
  <div
    className={cn(
      'grid items-center gap-4 px-6 h-12',
      'border-b border-border-default bg-surface-secondary/30',
      gridCols
    )}
  >
    {/* 名称列（含选择框） */}
    <div className="flex items-center gap-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
      {showSelect && onSelectAll && (
        <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
      )}
      <span>{columns[0]?.label || '名称'}</span>
    </div>
    {/* 中间列 */}
    {columns.slice(1, -1).map((col) => (
      <div
        key={col.key}
        className={cn(
          'text-xs font-medium text-text-tertiary uppercase tracking-wider',
          col.align === 'center' && 'text-center',
          col.align === 'right' && 'text-right'
        )}
      >
        {col.label}
      </div>
    ))}
    {/* 操作列 */}
    <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
      {columns[columns.length - 1]?.label || '操作'}
    </div>
  </div>
))
ResourceListHeader.displayName = 'ResourceListHeader'

/**
 * 资源列表内容区域
 * 提供内边距，让行与容器边框有间距
 */
export const ResourceListBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-2 space-y-1">
    {children}
  </div>
)

/**
 * 资源列表行
 * 封装整行点击、悬停高亮、选中状态、名称列、操作列
 * 悬停效果：浅色模式绿色边框、深色模式紫色边框（使用 --color-state-focus）
 */
export const ResourceListRow: React.FC<ResourceListRowProps> = memo(({
  onClick,
  selected,
  onSelect,
  avatar,
  name,
  description,
  children,
  actions,
  gridCols = 'grid-cols-[2fr_repeat(5,1fr)_60px]',
  className,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // 如果点击的是选择框或操作菜单，不触发行点击
    if ((e.target as HTMLElement).closest('[data-stop-propagation]')) {
      return
    }
    onClick()
  }

  return (
    <div
      className={cn(
        'group relative grid items-center gap-4',
        'px-4 h-[68px] rounded-xl cursor-pointer',
        'border border-transparent',
        'transition-all duration-200 ease-out',
        // 悬停效果：背景 + 主题色边框（浅色绿/深色紫）
        'hover:bg-surface-secondary/60 hover:border-state-focus hover:shadow-sm',
        // 选中效果
        selected && [
          'bg-surface-accent-subtle',
          'border-state-focus',
          'shadow-sm',
        ],
        gridCols,
        className
      )}
      onClick={handleClick}
    >
      {/* 名称列 */}
      <div className="flex items-center gap-4 min-w-0">
        {onSelect && (
          <div data-stop-propagation onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="transition-transform duration-150 hover:scale-110"
            />
          </div>
        )}
        {/* 头像 */}
        <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
          {avatar}
        </div>
        {/* 名称和描述 */}
        <div className="flex-1 min-w-0 h-11 flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <h3
              className="font-medium text-text-primary truncate group-hover:text-text-accent transition-colors duration-200"
              title={name}
            >
              {name}
            </h3>
            <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
          </div>
          {description && (
            <p
              className="text-sm text-text-tertiary truncate mt-0.5"
              title={description}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* 中间列（由调用方提供） */}
      {children}

      {/* 操作列 */}
      <div
        className="flex justify-end"
        data-stop-propagation
        onClick={(e) => e.stopPropagation()}
      >
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
          {actions.map((action) => (
            <DropdownItem
              key={action.key}
              icon={action.icon}
              onClick={action.onClick}
              danger={action.danger}
            >
              {action.label}
            </DropdownItem>
          ))}
        </Dropdown>
      </div>
    </div>
  )
})
ResourceListRow.displayName = 'ResourceListRow'

/**
 * 资源列表骨架屏行
 */
export const ResourceListSkeletonRow: React.FC<ResourceListSkeletonRowProps> = ({
  columnWidths = ['w-14', 'w-8', 'w-8', 'w-12', 'w-28'],
  gridCols = 'grid-cols-[2fr_repeat(5,1fr)_60px]',
}) => (
  <div className={cn('grid items-center gap-4 px-4 h-[68px] rounded-xl', gridCols)}>
    {/* 名称列骨架 */}
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-surface-secondary animate-pulse" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
        <div className="h-3 w-48 bg-surface-secondary rounded animate-pulse" />
      </div>
    </div>
    {/* 中间列骨架 */}
    {columnWidths.map((width, i) => (
      <div
        key={i}
        className={cn('h-4 bg-surface-secondary rounded animate-pulse', width)}
      />
    ))}
    {/* 操作列留空 */}
    <div />
  </div>
)
ResourceListSkeletonRow.displayName = 'ResourceListSkeletonRow'

/**
 * 资源列表空状态
 */
export const ResourceListEmpty: React.FC<{ text?: string }> = ({
  text = '暂无数据',
}) => (
  <div className="py-12 text-center text-text-tertiary">{text}</div>
)
ResourceListEmpty.displayName = 'ResourceListEmpty'
