import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, Database, Settings, Sparkles, Trash2 } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ResourceListBody,
  ResourceListContainer,
  ResourceListEmpty,
  ResourceListHeader,
  ResourceListRow,
  ResourceListSkeletonRow,
  getAvatarGradient,
} from '@/components/ui/resource-list'
import { cn } from '@/lib/utils'
import type { SearchAppListItem } from '@/types/search'
import {
  formatSearchTime,
  resolveKbCount,
  resolveRelatedEnabled,
  resolveSummaryEnabled,
  type SearchTimeFormat,
} from './utils'

const GRID_COLS = 'grid-cols-[2fr_100px_100px_120px_170px_60px]'

interface SearchListViewProps {
  data: SearchAppListItem[]
  isLoading?: boolean
  timeFormat?: SearchTimeFormat
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (app: SearchAppListItem) => void
}

const SearchAvatar: React.FC<{ app: SearchAppListItem }> = ({ app }) => {
  const gradient = getAvatarGradient(app.name)

  if (app.avatar) {
    return (
      <Avatar className="h-12 w-12">
        <AvatarImage src={app.avatar} alt={app.name} />
        <AvatarFallback>
          <Database className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-xl',
        'bg-gradient-to-br shadow-sm',
        gradient,
      )}
    >
      <span className="text-xl font-semibold text-white">
        {app.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

const SearchListView: React.FC<SearchListViewProps> = ({
  data,
  isLoading = false,
  timeFormat = 'detailed',
  onOpen,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation()
  const headerColumns = [
    { key: 'name', label: t('common.name', '名称') },
    { key: 'kb', label: t('layout.nav.knowledge', '知识库') },
    { key: 'summary', label: t('searchPage.filters.summary', 'AI 摘要') },
    { key: 'related', label: t('searchPage.filters.related', '相关问题') },
    { key: 'update_time', label: t('common.updateTime', '更新时间') },
    { key: 'actions', label: t('common.action', '操作') },
  ]

  return (
    <ResourceListContainer>
      <ResourceListHeader
        columns={headerColumns}
        gridCols={GRID_COLS}
        showSelect={false}
      />
      <ResourceListBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <ResourceListSkeletonRow
              key={i}
              gridCols={GRID_COLS}
              columnWidths={['w-14', 'w-10', 'w-14', 'w-24', 'w-28']}
            />
          ))
        ) : data.length === 0 ? (
          <ResourceListEmpty
            text={t('searchPage.empty.listTitle', '还没有搜索应用')}
          />
        ) : (
          data.map((app) => {
            const summaryEnabled = resolveSummaryEnabled(app)
            const relatedEnabled = resolveRelatedEnabled(app)

            return (
              <ResourceListRow
                key={app.id}
                onClick={() => onOpen(app.id)}
                avatar={<SearchAvatar app={app} />}
                name={app.name}
                description={app.description || undefined}
                gridCols={GRID_COLS}
                actions={[
                  {
                    key: 'settings',
                    label: t('searchPage.card.settings', '设置'),
                    icon: <Settings className="h-4 w-4" />,
                    onClick: () => onEdit(app.id),
                  },
                  {
                    key: 'delete',
                    label: t('searchPage.card.delete', '删除'),
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: () => onDelete(app),
                    danger: true,
                  },
                ]}
              >
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Database className="h-3.5 w-3.5" />
                  <span>{resolveKbCount(app)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {summaryEnabled
                      ? t('searchPage.filters.enabled', '已开启')
                      : t('searchPage.filters.disabled', '已关闭')}
                  </span>
                </div>
                <div className="text-sm text-text-secondary">
                  {relatedEnabled
                    ? t('searchPage.filters.enabled', '已开启')
                    : t('searchPage.filters.disabled', '已关闭')}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatSearchTime(app.update_time, timeFormat)}</span>
                </div>
              </ResourceListRow>
            )
          })
        )}
      </ResourceListBody>
    </ResourceListContainer>
  )
}

export default memo(SearchListView)
