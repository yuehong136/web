import { useMemo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Trash2,
  Database,
  FileText,
  Clock,
  Layers,
  Target,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ResourceListContainer,
  ResourceListHeader,
  ResourceListBody,
  ResourceListRow,
  ResourceListSkeletonRow,
  ResourceListEmpty,
  getAvatarGradient,
} from '@/components/ui/resource-list'
import {
  cn,
  formatTimestampDetailed,
  formatTimestampCompact,
  formatRelativeTime,
} from '@/lib/utils'
import { ROUTES } from '@/constants'
import type { KnowledgeBase } from '@/types/api'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'

export interface KnowledgeListViewProps {
  data: KnowledgeBase[]
  onEdit?: (kb: KnowledgeBase) => void
  onDelete?: (kb: KnowledgeBase) => void
  selectedIds?: string[]
  onSelect?: (id: string) => void
  onSelectAll?: () => void
  isLoading?: boolean
  timeFormat?: TimeFormatType
  getStatusColor: (kb: KnowledgeBase) => string
  getStatusText: (kb: KnowledgeBase) => string
}

const GRID_COLS = 'grid-cols-[2fr_90px_80px_80px_100px_150px_60px]'

const SKELETON_WIDTHS = ['w-14', 'w-8', 'w-8', 'w-12', 'w-28']

const formatTime = (timestamp: number, format: TimeFormatType): string => {
  switch (format) {
    case 'detailed':
      return formatTimestampDetailed(timestamp)
    case 'compact':
      return formatTimestampCompact(timestamp)
    case 'relative':
      return formatRelativeTime(timestamp)
    default:
      return formatTimestampDetailed(timestamp)
  }
}

const KnowledgeAvatar: FC<{ kb: KnowledgeBase }> = ({ kb }) => {
  const gradient = getAvatarGradient(kb.name)

  if (kb.avatar) {
    return (
      <Avatar className="h-12 w-12">
        <AvatarImage src={kb.avatar} alt={kb.name} />
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
        {kb.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

const KnowledgeListRow: FC<{
  kb: KnowledgeBase
  selected: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  timeFormat: TimeFormatType
  getStatusColor: (kb: KnowledgeBase) => string
  getStatusText: (kb: KnowledgeBase) => string
}> = ({
  kb,
  selected,
  onSelect,
  onEdit,
  onDelete,
  timeFormat,
  getStatusColor,
  getStatusText,
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleClick = () => {
    navigate(`${ROUTES.KNOWLEDGE}/${kb.id}`)
  }

  const actions = []
  if (onEdit) {
    actions.push({
      key: 'settings',
      label: t('knowledge.list.actions.settings'),
      icon: <Settings className="h-4 w-4" />,
      onClick: onEdit,
    })
  }
  if (onDelete) {
    actions.push({
      key: 'delete',
      label: t('knowledge.list.actions.delete'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      danger: true,
    })
  }

  return (
    <ResourceListRow
      onClick={handleClick}
      selected={selected}
      onSelect={onSelect}
      avatar={<KnowledgeAvatar kb={kb} />}
      name={kb.name}
      description={kb.description || undefined}
      actions={actions}
      gridCols={GRID_COLS}
    >
      <div className="flex items-center">
        <span
          className={cn(
            'inline-flex items-center truncate rounded-full px-2 py-0.5 text-xs font-medium',
            getStatusColor(kb),
          )}
        >
          {getStatusText(kb)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <FileText className="h-3.5 w-3.5 shrink-0" />
        <span>{kb.doc_num ?? 0}</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Layers className="h-3.5 w-3.5 shrink-0" />
        <span>{kb.chunk_num ?? 0}</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Target className="h-3.5 w-3.5 shrink-0" />
        <span>{(kb.token_num ?? 0).toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {kb.update_time ? formatTime(kb.update_time, timeFormat) : '-'}
      </div>
    </ResourceListRow>
  )
}

export const KnowledgeListView: FC<KnowledgeListViewProps> = ({
  data,
  onEdit,
  onDelete,
  selectedIds = [],
  onSelect,
  onSelectAll,
  isLoading = false,
  timeFormat = 'detailed',
  getStatusColor,
  getStatusText,
}) => {
  const allSelected = data.length > 0 && selectedIds.length === data.length
  const { t } = useTranslation()
  const headerColumns = useMemo(
    () => [
      { key: 'name', label: t('knowledge.list.table.name') },
      { key: 'status', label: t('knowledge.list.table.status') },
      { key: 'doc_num', label: t('knowledge.list.table.documents') },
      { key: 'chunk_num', label: t('knowledge.list.table.chunks') },
      { key: 'token_num', label: t('knowledge.list.table.tokens') },
      { key: 'update_time', label: t('knowledge.list.table.updatedAt') },
      { key: 'actions', label: t('knowledge.list.table.actions') },
    ],
    [t],
  )

  return (
    <ResourceListContainer>
      <ResourceListHeader
        columns={headerColumns}
        allSelected={allSelected}
        onSelectAll={onSelectAll}
        showSelect={!!onSelect}
        gridCols={GRID_COLS}
      />

      <ResourceListBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <ResourceListSkeletonRow
              key={i}
              columnWidths={SKELETON_WIDTHS}
              gridCols={GRID_COLS}
            />
          ))
        ) : data.length === 0 ? (
          <ResourceListEmpty />
        ) : (
          data.map((kb) => (
            <KnowledgeListRow
              key={kb.id}
              kb={kb}
              selected={selectedIds.includes(kb.id)}
              onSelect={onSelect ? () => onSelect(kb.id) : undefined}
              onEdit={onEdit ? () => onEdit(kb) : undefined}
              onDelete={onDelete ? () => onDelete(kb) : undefined}
              timeFormat={timeFormat}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          ))
        )}
      </ResourceListBody>
    </ResourceListContainer>
  )
}

KnowledgeListView.displayName = 'KnowledgeListView'
