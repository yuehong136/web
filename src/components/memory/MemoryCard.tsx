import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpRight,
  Clock3,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  LockKeyhole,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { MemoryTypeBadge } from './memory-labels'
import type { Memory } from '@/types/memory'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

export function MemoryCard({
  data,
  onEdit,
  onDelete,
}: {
  data: Memory
  onEdit?: (memory: Memory) => void
  onDelete?: (memory: Memory) => void
}) {
  const { t, i18n } = useTranslation()
  const PermissionIcon = data.permissions === 'team' ? Users : LockKeyhole
  return (
    <article className="group relative flex h-full flex-col rounded-radius-xl border border-border-subtle bg-background-surface transition-colors hover:border-state-focus">
      <div className="flex items-start gap-space-base p-space-lg">
        <EntityAvatar
          name={data.name}
          src={data.avatar}
          seed={data.id}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-text-primary">
            <Link
              className="outline-none after:absolute after:inset-0 after:rounded-radius-xl focus-visible:after:ring-2 focus-visible:after:ring-state-focus"
              to={`/memory/${data.id}`}
            >
              {data.name}
            </Link>
          </h2>
          <p className="mt-space-xs flex items-center gap-space-xs text-xs text-text-tertiary">
            <PermissionIcon className="size-icon-xs" />
            {t(
              data.permissions === 'team'
                ? 'memory.fields.team'
                : 'memory.fields.onlyMe',
            )}
          </p>
        </div>
        <div className="relative z-10">
          <ActionMenu>
            <ActionMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('memory.workspace.memoryActions', {
                  name: data.name,
                })}
              >
                <MoreHorizontal className="size-icon-sm" />
              </Button>
            </ActionMenuTrigger>
            <ActionMenuContent align="end">
              <ActionMenuItem onSelect={() => onEdit?.(data)}>
                <Pencil className="size-icon-sm" />
                {t('common.edit')}
              </ActionMenuItem>
              <ActionMenuItem danger onSelect={() => onDelete?.(data)}>
                <Trash2 className="size-icon-sm" />
                {t('common.delete')}
              </ActionMenuItem>
            </ActionMenuContent>
          </ActionMenu>
        </div>
      </div>
      <div className="flex-1 px-space-lg pb-space-lg">
        <p className="mb-space-base line-clamp-2 min-h-10 text-sm leading-relaxed text-text-secondary">
          {data.description || t('memory.workspace.cardDescription')}
        </p>
        <div className="flex flex-wrap gap-space-xs">
          {data.memory_type.map((type) => (
            <MemoryTypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
      <footer className="flex items-center justify-between gap-space-sm border-t border-border-subtle px-space-lg py-space-base text-xs text-text-tertiary">
        <span>
          {t('memory.fields.storageType')} ·{' '}
          {t(
            data.storage_type === 'graph'
              ? 'memory.fields.graph'
              : 'memory.fields.table',
          )}
        </span>
        <span className="flex items-center gap-space-xs">
          <Clock3 className="size-icon-xs" />
          {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
            dateStyle: 'medium',
          }).format(data.update_time ?? data.create_time)}
        </span>
        <ArrowUpRight className="size-icon-sm text-text-secondary transition-transform group-hover:translate-x-0.5" />
      </footer>
    </article>
  )
}
