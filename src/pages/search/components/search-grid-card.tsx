import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Clock,
  Database,
  MoreVertical,
  Settings,
  Sparkles,
  Trash2,
  Workflow,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { cn } from '@/lib/utils'
import type { SearchAppListItem } from '@/types/search'
import {
  formatSearchTime,
  resolveKbCount,
  resolveRelatedEnabled,
  resolveSummaryEnabled,
  type SearchTimeFormat,
} from './utils'

interface SearchGridCardProps {
  app: SearchAppListItem
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (app: SearchAppListItem) => void
  timeFormat: SearchTimeFormat
}

const SearchGridCard: React.FC<SearchGridCardProps> = ({
  app,
  onOpen,
  onEdit,
  onDelete,
  timeFormat,
}) => {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const gradient = getAvatarGradient(app.name)
  const kbCount = resolveKbCount(app)
  const summaryEnabled = resolveSummaryEnabled(app)
  const relatedEnabled = resolveRelatedEnabled(app)

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-2xl border transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5',
        isHovered && 'ring-2 ring-blue-500/20',
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered
          ? 'var(--color-state-focus)'
          : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(app.id)}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {app.avatar ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={app.avatar} alt={app.name} />
                <AvatarFallback>
                  <Database className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  'bg-gradient-to-br shadow-sm',
                  gradient,
                )}
              >
                <span className="text-lg font-semibold text-white">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-text-primary">
                {app.name}
              </h3>
              <div className="mt-1 flex flex-wrap gap-1">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    summaryEnabled
                      ? 'bg-[var(--color-status-success-10)] text-text-success'
                      : 'bg-background-subtle text-text-secondary',
                  )}
                >
                  {summaryEnabled
                    ? t('searchPage.card.summaryOn', '摘要开启')
                    : t('searchPage.card.summaryOff', '摘要关闭')}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    relatedEnabled
                      ? 'bg-[var(--color-status-info-10)] text-text-accent'
                      : 'bg-background-subtle text-text-secondary',
                  )}
                >
                  {relatedEnabled
                    ? t('searchPage.card.relatedOn', '相关问题开启')
                    : t('searchPage.card.relatedOff', '相关问题关闭')}
                </span>
              </div>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              trigger={
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownItem
                icon={<Settings className="h-4 w-4" />}
                onClick={() => onEdit(app.id)}
              >
                {t('searchPage.card.settings', '设置')}
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => onDelete(app)}
                danger
              >
                {t('searchPage.card.delete', '删除')}
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {app.description ? (
          <p className="mb-4 line-clamp-2 text-sm text-text-secondary">
            {app.description}
          </p>
        ) : null}

        <div
          className={cn(
            'grid grid-cols-2 gap-3 text-sm text-text-tertiary',
            !app.description && 'mt-4',
          )}
        >
          <div className="flex items-center">
            <Database className="mr-1.5 h-4 w-4" />
            {t('searchPage.card.knowledgeBases', '{{count}} 知识库', {
              count: kbCount,
            })}
          </div>
          <div className="flex items-center">
            <Clock className="mr-1.5 h-4 w-4" />
            {formatSearchTime(app.update_time, timeFormat)}
          </div>
          <div className="flex items-center">
            <Sparkles className="mr-1.5 h-4 w-4" />
            {summaryEnabled
              ? t('searchPage.card.summaryOn', '摘要开启')
              : t('searchPage.card.summaryOff', '摘要关闭')}
          </div>
          <div className="flex items-center">
            <Workflow className="mr-1.5 h-4 w-4" />
            {relatedEnabled
              ? t('searchPage.card.relatedOn', '相关问题开启')
              : t('searchPage.card.relatedOff', '相关问题关闭')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(SearchGridCard)
