/**
 * 记忆库详情页侧边栏组件
 * 优化版本：状态指示、活跃指示条、渐变光环
 */

import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { MessageSquare, Settings, Database, Clock, Activity } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn, formatRelativeTime, formatBytes } from '@/lib/utils'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import type { Memory } from '@/types/memory'

interface MemorySidebarProps {
  memory: Memory | null
  isLoading?: boolean
}

export const MemorySidebar: React.FC<MemorySidebarProps> = ({
  memory,
  isLoading = false,
}) => {
  const { id } = useParams<{ id: string }>()

  // 导航项配置
  const navItems = [
    {
      to: `/memory/${id}`,
      icon: MessageSquare,
      label: MEMORY_TEXTS.sideBar.messages,
      end: true,
    },
    {
      to: `/memory/${id}/settings`,
      icon: Settings,
      label: MEMORY_TEXTS.sideBar.configuration,
    },
  ]

  // 生成头像背景渐变
  const avatarGradient = React.useMemo(() => {
    if (!memory?.name) return 'from-purple-500 to-pink-500'
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ]
    const index = memory.name.charCodeAt(0) % gradients.length
    return gradients[index]
  }, [memory?.name])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background-surface border-r border-border-default">
        {/* 骨架屏 */}
        <div className="p-6 space-y-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-background-subtle" />
          <div className="h-5 w-3/4 bg-background-subtle rounded" />
          <div className="h-4 w-1/2 bg-background-subtle rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background-surface border-r border-border-default">
      {/* 头部信息区 */}
      <div className="p-6 border-b border-border-default">
        {/* 头像带渐变光环和状态指示 */}
        <div className="mb-4 relative inline-block">
          {/* 渐变光环背景 */}
          <div className={cn(
            'absolute -inset-1 rounded-2xl opacity-30 blur-sm',
            'bg-gradient-to-br',
            avatarGradient
          )} />
          
          {memory?.avatar ? (
            <Avatar
              src={memory.avatar}
              alt={memory.name}
              size="xl"
              className="relative ring-2 ring-surface-primary shadow-lg w-16 h-16"
            />
          ) : (
            <div
              className={cn(
                'relative w-16 h-16 rounded-2xl flex items-center justify-center',
                'bg-gradient-to-br shadow-lg',
                avatarGradient
              )}
            >
              <span className="text-white font-bold text-2xl">
                {memory?.name?.charAt(0).toUpperCase() || 'M'}
              </span>
            </div>
          )}
          
          {/* 状态指示点 */}
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full',
            'border-2 border-surface-primary',
            'bg-status-success'
          )} />
        </div>

        {/* 名称和描述 */}
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          {memory?.name || MEMORY_TEXTS.common.loading}
        </h2>
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {memory?.description || MEMORY_TEXTS.config.descriptionPlaceholder}
        </p>

        {/* 元信息 */}
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <Activity className="h-3.5 w-3.5 text-status-success" />
            <span>在线</span>
          </div>
          <div className="flex items-center gap-2 text-text-tertiary">
            <Database className="h-3.5 w-3.5" />
            <span>
              {memory?.storage_type === 'graph'
                ? MEMORY_TEXTS.config.graph
                : MEMORY_TEXTS.config.table}
            </span>
            {memory?.memory_size && (
              <>
                <span className="text-border-default">·</span>
                <span>{formatBytes(memory.memory_size)}</span>
              </>
            )}
          </div>
          {memory?.create_time && (
            <div className="flex items-center gap-2 text-text-tertiary">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatRelativeTime(memory.create_time)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg relative',
                  'text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-text-accent/10 text-text-accent'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* 左侧活跃指示条 */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-text-accent" />
                  )}
                  <item.icon
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isActive ? 'text-text-accent' : 'group-hover:scale-110'
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

MemorySidebar.displayName = 'MemorySidebar'
