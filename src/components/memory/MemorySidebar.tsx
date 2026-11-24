import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import {
  ArrowLeft,
  Database,
  MessageSquare,
  Settings,
  Sparkles,
  ListTodo,
  Shrink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatBytes } from '@/lib/utils'
import { ROUTES } from '@/constants'
import type { Memory } from '@/types/memory'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

interface MemorySidebarProps {
  memory: Memory | null
  isLoading?: boolean
  memoryId?: string
  recoveryOnly?: boolean
}

export function MemorySidebar({
  memory,
  isLoading = false,
  memoryId,
  recoveryOnly = false,
}: MemorySidebarProps) {
  const { t, i18n } = useTranslation()
  const id = memoryId || memory?.id
  const operations = {
    to: `/memory/${id}/operations`,
    icon: ListTodo,
    label: t('memory.recovery.title'),
    end: true,
  }
  const items: {
    to: string
    icon: LucideIcon
    label: string
    end?: boolean
  }[] = recoveryOnly
    ? [operations]
    : [
        {
          to: `/memory/${id}`,
          icon: MessageSquare,
          label: t('memory.workspace.title'),
          end: true,
        },
        {
          to: `/memory/${id}/settings`,
          icon: Settings,
          label: t('memory.workspace.strategy'),
        },
        {
          to: `/memory/${id}/maintenance`,
          icon: Sparkles,
          label: t('memory.dreaming.title'),
        },
        {
          to: `/memory/${id}/verification`,
          icon: ListTodo,
          label: t('memory.verification.title'),
        },
        {
          to: `/memory/${id}/startup`,
          icon: MessageSquare,
          label: t('memory.startup.title'),
        },
        {
          to: `/memory/${id}/compaction`,
          icon: Shrink,
          label: t('memory.compaction.title'),
        },
        operations,
      ]
  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center border-b border-line-subtle px-space-sm">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start text-fg-muted"
        >
          <Link to={ROUTES.MEMORY}>
            <ArrowLeft className="size-icon-sm" />
            {t('memory.common.allMemories')}
          </Link>
        </Button>
      </header>
      <div className="flex items-center gap-space-sm px-space-base py-space-base">
        <EntityAvatar
          name={memory?.name}
          src={memory?.avatar}
          seed={memory?.id}
          icon={memory ? undefined : <Database />}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={memory?.name}>
            {memory?.name ||
              (recoveryOnly
                ? t('memory.recovery.bankIdentifier', { id })
                : t('memory.common.loading'))}
          </p>
          {memory?.description && (
            <p
              className="truncate text-xs text-fg-muted"
              title={memory.description}
            >
              {memory.description}
            </p>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="mx-space-base h-16 animate-pulse rounded-radius-md bg-sunken" />
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
                  'flex min-h-9 items-center gap-space-sm rounded-radius-md px-space-sm text-sm focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:outline-hidden',
                  isActive
                    ? 'bg-fill-selected font-medium text-fg'
                    : 'text-fg-muted hover:bg-fill-hover hover:text-fg',
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
        <footer className="mt-auto space-y-space-xs border-t border-line-subtle px-space-base py-space-base text-xs text-fg-subtle">
          <p>
            {memory.storage_type === 'graph'
              ? t('memory.fields.graph')
              : t('memory.fields.table')}
            {typeof memory.memory_size === 'number' && (
              <>
                {' '}
                · {t('memory.workspace.capacity')}{' '}
                {formatBytes(memory.memory_size)}
              </>
            )}
          </p>
          {memory.create_time && (
            <p>
              {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                dateStyle: 'medium',
              }).format(memory.create_time)}
            </p>
          )}
        </footer>
      )}
    </div>
  )
}
