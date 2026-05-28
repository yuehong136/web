/**
 * 记忆库详情页侧边栏组件
 * 优化版本：状态指示、活跃指示条、渐变光环
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Settings,
  Database,
  Clock,
  Activity,
  ArrowLeft,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime, formatBytes } from '@/lib/utils'
import { ROUTES } from '@/constants'
import type { Memory } from '@/types/memory'

interface MemorySidebarProps {
  memory: Memory | null
  isLoading?: boolean
}

export function MemorySidebar({
  memory,
  isLoading = false,
}: MemorySidebarProps) {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // 导航项配置
  const navItems = [
    {
      to: `/memory/${id}`,
      icon: MessageSquare,
      label: t('memory.messages.title'),
      end: true,
    },
    {
      to: `/memory/${id}/settings`,
      icon: Settings,
      label: t('memory.config.title'),
    },
  ]

  // 生成头像背景渐变 - 使用语义令牌
  const avatarGradient = useMemo(() => {
    if (!memory?.name)
      return 'from-components-avatar-gradient-purple-from to-components-avatar-gradient-purple-to'
    const gradients = [
      'from-components-avatar-gradient-purple-from to-components-avatar-gradient-purple-to',
      'from-components-avatar-gradient-blue-from to-components-avatar-gradient-blue-to',
      'from-components-avatar-gradient-green-from to-components-avatar-gradient-green-to',
      'from-components-avatar-gradient-orange-from to-components-avatar-gradient-orange-to',
      'from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
    ]
    const index = memory.name.charCodeAt(0) % gradients.length
    return gradients[index]
  }, [memory?.name])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col border-r border-border-default bg-background-surface">
        {/* 返回按钮 - 加载时也可用 */}
        <div className="px-4 pb-0 pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-space-xs text-text-secondary hover:text-text-primary"
            onClick={() => navigate(ROUTES.MEMORY)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('memory.common.allMemories')}</span>
          </Button>
        </div>
        {/* 骨架屏 */}
        <div className="animate-pulse space-y-4 px-6 pb-6 pt-4">
          <div className="h-16 w-16 rounded-2xl bg-background-subtle" />
          <div className="h-5 w-3/4 rounded bg-background-subtle" />
          <div className="h-4 w-1/2 rounded bg-background-subtle" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col border-r border-border-default bg-background-surface">
      {/* 返回按钮 */}
      <div className="px-4 pb-0 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-space-xs text-text-secondary hover:text-text-primary"
          onClick={() => navigate(ROUTES.MEMORY)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('memory.common.allMemories')}</span>
        </Button>
      </div>

      {/* 头部信息区 */}
      <div className="border-b border-border-default px-6 pb-6 pt-4">
        {/* 头像带渐变光环和状态指示 */}
        <div className="relative mb-4 inline-block">
          {/* 渐变光环背景 */}
          <div
            className={cn(
              'absolute -inset-1 rounded-2xl opacity-30 blur-sm',
              'bg-gradient-to-br',
              avatarGradient,
            )}
          />

          {memory?.avatar ? (
            <Avatar className="ring-surface-primary relative h-16 w-16 shadow-lg ring-2">
              <AvatarImage src={memory.avatar} alt={memory.name} />
              <AvatarFallback>
                <Database className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className={cn(
                'relative flex h-16 w-16 items-center justify-center rounded-2xl',
                'bg-gradient-to-br shadow-sm',
                avatarGradient,
              )}
            >
              <span className="text-[28px] font-semibold text-components-button-primary-text">
                {memory?.name?.charAt(0).toUpperCase() || 'M'}
              </span>
            </div>
          )}

          {/* 状态指示点 */}
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full',
              'border-surface-primary border-2',
              'bg-status-success',
            )}
          />
        </div>

        {/* 名称和描述 */}
        <h2 className="mb-1 text-lg font-semibold text-text-primary">
          {memory?.name || t('memory.common.loading')}
        </h2>
        <p className="mb-3 line-clamp-2 text-sm text-text-secondary">
          {memory?.description || t('memory.fields.descriptionPlaceholder')}
        </p>

        {/* 元信息 */}
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <Activity className="h-3.5 w-3.5 text-status-success" />
            <span>{t('memory.common.online')}</span>
          </div>
          <div className="flex items-center gap-2 text-text-tertiary">
            <Database className="h-3.5 w-3.5" />
            <span>
              {memory?.storage_type === 'graph'
                ? t('memory.fields.graph')
                : t('memory.fields.table')}
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
                  'relative flex items-center gap-3 rounded-lg px-4 py-2.5',
                  'text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-text-accent/10 text-text-accent'
                    : 'hover:bg-surface-secondary text-text-secondary hover:text-text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* 左侧活跃指示条 */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-text-accent" />
                  )}
                  <item.icon
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isActive ? 'text-text-accent' : 'group-hover:scale-110',
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
