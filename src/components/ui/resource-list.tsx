/**
 * 通用资源列表组件
 * 提供统一的列表行交互：整行点击进入、悬停高亮、选中状态、操作下拉
 * 用于记忆库、知识库、工作室等页面的列表视图
 */

import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
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
  /** 名称之后各列占位条的宽度 */
  columnWidths?: string[]
  /** 第几行，决定图标块的身份色 */
  index?: number
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
    className={cn('w-full rounded-xl border border-line bg-surface', className)}
  >
    {children}
  </div>
)

/**
 * 资源列表表头
 */
export const ResourceListHeader: React.FC<ResourceListHeaderProps> = memo(
  ({
    columns,
    allSelected,
    onSelectAll,
    showSelect = true,
    gridCols = 'grid-cols-[2fr_repeat(5,1fr)_60px]',
  }) => (
    <div
      className={cn(
        'grid h-12 items-center gap-4 px-6',
        'border-b border-line bg-sunken/30',
        gridCols,
      )}
    >
      {/* 名称列（含选择框） */}
      <div className="flex items-center gap-3 text-xs font-medium tracking-wider text-fg-subtle uppercase">
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
            'text-xs font-medium tracking-wider text-fg-subtle uppercase',
            col.align === 'center' && 'text-center',
            col.align === 'right' && 'text-right',
          )}
        >
          {col.label}
        </div>
      ))}
      {/* 操作列 */}
      <div className="text-right text-xs font-medium tracking-wider text-fg-subtle uppercase">
        {columns[columns.length - 1]?.label || '操作'}
      </div>
    </div>
  ),
)
ResourceListHeader.displayName = 'ResourceListHeader'

/**
 * 资源列表内容区域
 * 提供内边距，让行与容器边框有间距
 */
export const ResourceListBody: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="space-y-1 p-2">{children}</div>

/**
 * 资源列表行
 * 封装整行点击、悬停高亮、选中状态、名称列、操作列
 * 悬停效果：浅色模式绿色边框、深色模式紫色边框（使用 --color-line-focus）
 */
export const ResourceListRow: React.FC<ResourceListRowProps> = memo(
  ({
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
    const { t } = useTranslation()
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
          'h-[68px] cursor-pointer rounded-xl px-4',
          'border border-transparent',
          'transition-all duration-(--motion-panel) ease-out',
          // 悬停效果：背景 + 主题色边框（浅色绿/深色紫）
          'hover:border-line-focus hover:bg-sunken/60 hover:shadow-xs',
          // 选中效果
          selected && ['bg-accent-soft', 'border-line-focus', 'shadow-xs'],
          gridCols,
          className,
        )}
        onClick={handleClick}
      >
        {/* 名称列 */}
        <div className="flex min-w-0 items-center gap-4">
          {onSelect && (
            <div data-stop-propagation onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selected}
                onCheckedChange={onSelect}
                className="transition-transform duration-(--motion-fast) hover:scale-110"
              />
            </div>
          )}
          {/* 头像 */}
          <div className="shrink-0 transition-transform duration-(--motion-panel) group-hover:scale-105">
            {avatar}
          </div>
          {/* 名称和描述 */}
          <div className="flex h-11 min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h3
                className="truncate font-medium text-fg transition-colors duration-(--motion-panel) group-hover:text-accent-fg"
                title={name}
              >
                {name}
              </h3>
              <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle opacity-0 transition-all duration-(--motion-panel) group-hover:translate-x-0.5 group-hover:opacity-100" />
            </div>
            {description && (
              <p
                className="mt-0.5 truncate text-sm text-fg-subtle"
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
          <ActionMenu>
            <ActionMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('common.more')}
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreVertical className="size-icon-sm" />
              </Button>
            </ActionMenuTrigger>
            <ActionMenuContent align="end">
              {actions.map((action) => (
                <ActionMenuItem
                  key={action.key}
                  danger={action.danger}
                  onSelect={action.onClick}
                >
                  {action.icon}
                  {action.label}
                </ActionMenuItem>
              ))}
            </ActionMenuContent>
          </ActionMenu>
        </div>
      </div>
    )
  },
)
ResourceListRow.displayName = 'ResourceListRow'

/** Identity tints the placeholder tiles cycle through, as real items do. */
const SKELETON_TILE_TONES = [
  'bg-avatar-1-bg',
  'bg-avatar-5-bg',
  'bg-avatar-7-bg',
  'bg-avatar-3-bg',
  'bg-avatar-6-bg',
  'bg-avatar-2-bg',
] as const

/**
 * 资源列表骨架屏行：DreamJira 行高（44px，紧凑 36px）、6px 圆角，保留彩色
 * 图标块的位置。`columnWidths` 是名称之后各列占位条的宽度。
 */
export const ResourceListSkeletonRow: React.FC<
  ResourceListSkeletonRowProps
> = ({ columnWidths = ['w-16', 'w-24'], index = 0 }) => (
  <div
    aria-hidden="true"
    data-slot="resource-row-skeleton"
    className="flex h-[var(--row-height)] items-center gap-space-base rounded-radius-md px-space-sm"
  >
    <div
      className={cn(
        'size-7 shrink-0 rounded-radius-md opacity-70',
        SKELETON_TILE_TONES[index % SKELETON_TILE_TONES.length],
      )}
    />
    <div className="h-3 w-40 max-w-[40%] skeleton-shimmer rounded-radius-sm" />
    <span className="flex-1" />
    {columnWidths.map((width, i) => (
      <div
        key={i}
        className={cn('h-3 skeleton-shimmer rounded-radius-sm', width)}
      />
    ))}
  </div>
)
ResourceListSkeletonRow.displayName = 'ResourceListSkeletonRow'

/**
 * 资源列表空状态
 */
export const ResourceListEmpty: React.FC<{ text?: string }> = ({
  text = '暂无数据',
}) => <div className="py-12 text-center text-fg-subtle">{text}</div>
ResourceListEmpty.displayName = 'ResourceListEmpty'
