import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { ArrowLeft, Database, MessageSquare, Settings } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime, formatBytes } from '@/lib/utils'
import { ROUTES } from '@/constants'
import type { Memory } from '@/types/memory'

interface MemorySidebarProps {
  memory: Memory | null
  isLoading?: boolean
  memoryId?: string
}

export function MemorySidebar({
  memory,
  isLoading = false,
  memoryId,
}: MemorySidebarProps) {
  const { t } = useTranslation()
  const id = memoryId || memory?.id
  const items = [
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
  return (
    <div className="flex h-full min-h-0 flex-col bg-components-sidebar-bg">
      <header className="flex h-12 shrink-0 items-center border-b border-border-subtle px-space-sm">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start text-text-secondary"
        >
          <Link to={ROUTES.MEMORY}>
            <ArrowLeft className="size-icon-sm" />
            {t('memory.common.allMemories')}
          </Link>
        </Button>
      </header>
      <div className="flex items-center gap-space-sm px-space-base py-space-base">
        <Avatar className="h-8 w-8 shrink-0 rounded-radius-md">
          <AvatarImage src={memory?.avatar || undefined} alt="" />
          <AvatarFallback className="bg-background-subtle text-text-secondary">
            <Database className="size-icon-sm" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={memory?.name}>
            {memory?.name || t('memory.common.loading')}
          </p>
          {memory?.description && (
            <p
              className="truncate text-xs text-text-secondary"
              title={memory.description}
            >
              {memory.description}
            </p>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="mx-space-base h-16 animate-pulse rounded-radius-md bg-background-subtle" />
      ) : (
        <nav
          aria-label={memory?.name || t('layout.nav.memory')}
          className="flex-1 space-y-space-xs overflow-y-auto p-space-sm"
        >
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-9 items-center gap-space-sm rounded-radius-md px-space-sm text-sm focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
                  isActive
                    ? 'bg-components-sidebar-item-bg-active font-medium text-text-primary'
                    : 'text-text-secondary hover:bg-state-hover hover:text-text-primary',
                )
              }
            >
              <Icon className="size-icon-sm" />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
      {memory && (
        <footer className="mt-auto space-y-space-xs border-t border-border-subtle px-space-base py-space-base text-xs text-text-tertiary">
          <p>
            {memory.storage_type === 'graph'
              ? t('memory.fields.graph')
              : t('memory.fields.table')}
            {typeof memory.memory_size === 'number' && (
              <> · {formatBytes(memory.memory_size)}</>
            )}
          </p>
          {memory.create_time && (
            <p>{formatRelativeTime(memory.create_time)}</p>
          )}
        </footer>
      )}
    </div>
  )
}
