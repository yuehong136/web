import React, { memo, useState } from 'react'
import { Clock, Database, MoreVertical, Search, Settings, Sparkles, Trash2, Workflow } from 'lucide-react'
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
  const [isHovered, setIsHovered] = useState(false)
  const gradient = getAvatarGradient(app.name)
  const kbCount = resolveKbCount(app)
  const summaryEnabled = resolveSummaryEnabled(app)
  const relatedEnabled = resolveRelatedEnabled(app)

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-300 cursor-pointer',
        'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        isHovered && 'ring-2 ring-blue-500/20'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered ? 'var(--color-state-focus)' : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(app.id)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {app.avatar ? (
              <img
                src={app.avatar}
                alt={app.name}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-sm',
                  gradient
                )}
              >
                <Search className="h-5 w-5 text-white" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-text-primary">{app.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    summaryEnabled
                      ? 'text-text-success bg-[var(--color-state-success-10)]'
                      : 'text-text-secondary bg-background-subtle'
                  )}
                >
                  {summaryEnabled ? '摘要开启' : '摘要关闭'}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    relatedEnabled
                      ? 'text-text-accent bg-[var(--color-state-info-10)]'
                      : 'text-text-secondary bg-background-subtle'
                  )}
                >
                  {relatedEnabled ? '相关问题开启' : '相关问题关闭'}
                </span>
              </div>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              trigger={(
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            >
              <DropdownItem icon={<Settings className="h-4 w-4" />} onClick={() => onEdit(app.id)}>
                设置
              </DropdownItem>
              <DropdownItem icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(app)} danger>
                删除
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {app.description ? (
          <p className="text-sm mb-4 line-clamp-2 text-text-secondary">{app.description}</p>
        ) : null}

        <div className={cn('grid grid-cols-2 gap-3 text-sm text-text-tertiary', !app.description && 'mt-4')}>
          <div className="flex items-center">
            <Database className="h-4 w-4 mr-1.5" />
            {kbCount} 知识库
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1.5" />
            {formatSearchTime(app.update_time, timeFormat)}
          </div>
          <div className="flex items-center">
            <Sparkles className="h-4 w-4 mr-1.5" />
            {summaryEnabled ? '摘要开启' : '摘要关闭'}
          </div>
          <div className="flex items-center">
            <Workflow className="h-4 w-4 mr-1.5" />
            {relatedEnabled ? '相关问题开启' : '相关问题关闭'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(SearchGridCard)
