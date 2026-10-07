import type { FC } from 'react'
import {
  Clock,
  FileText,
  Layers,
  MoreVertical,
  Settings,
  Target,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { cn } from '@/lib/utils'
import type { KnowledgeBase } from '@/types/api'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

interface KnowledgeCardProps {
  formatTime: (timestamp: number) => string
  getStatusClassName: (knowledgeBase: KnowledgeBase) => string
  getStatusText: (knowledgeBase: KnowledgeBase) => string
  knowledgeBase: KnowledgeBase
  onClick: () => void
  onDelete: () => void
  onSelect: (checked: boolean) => void
  onSettings: () => void
  selected: boolean
}

export const KnowledgeCard: FC<KnowledgeCardProps> = ({
  formatTime,
  getStatusClassName,
  getStatusText,
  knowledgeBase,
  onClick,
  onDelete,
  onSelect,
  onSettings,
  selected,
}) => {
  const { t } = useTranslation()

  return (
    <Card
      className={cn(
        'group relative cursor-pointer rounded-radius-xl transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-state-focus hover:shadow-elevation-medium',
        selected && 'ring-2 ring-text-accent',
      )}
      onClick={onClick}
      padding="none"
    >
      <div className="p-space-lg">
        <div className="mb-space-base flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-space-sm">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              onClick={(event) => event.stopPropagation()}
            />
            <EntityAvatar
              name={knowledgeBase.name}
              src={knowledgeBase.avatar}
              seed={knowledgeBase.id}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-text-primary">
                {knowledgeBase.name}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center rounded-radius-full px-space-sm py-0.5 text-xs font-medium',
                  getStatusClassName(knowledgeBase),
                )}
              >
                {getStatusText(knowledgeBase)}
              </span>
            </div>
          </div>
          <Dropdown
            trigger={
              <Button
                onClick={(event) => event.stopPropagation()}
                size="icon-sm"
                variant="ghost"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          >
            <DropdownItem
              icon={<Settings className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation()
                onSettings()
              }}
            >
              {t('knowledge.list.actions.settings')}
            </DropdownItem>
            <DropdownItem
              danger
              icon={<Trash2 className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
            >
              {t('knowledge.list.actions.delete')}
            </DropdownItem>
          </Dropdown>
        </div>

        {knowledgeBase.description ? (
          <p className="mb-space-base line-clamp-2 text-sm text-text-secondary">
            {knowledgeBase.description}
          </p>
        ) : null}

        <div
          className={cn(
            'grid grid-cols-2 gap-space-sm text-sm text-text-tertiary',
            !knowledgeBase.description && 'mt-space-base',
          )}
        >
          <div className="flex items-center">
            <FileText className="mr-1.5 h-4 w-4" />
            {t('knowledge.common.documentsCount', {
              count: knowledgeBase.doc_num || 0,
            })}
          </div>
          <div className="flex items-center">
            <Layers className="mr-1.5 h-4 w-4" />
            {t('knowledge.common.chunksCount', {
              count: knowledgeBase.chunk_num || 0,
            })}
          </div>
          <div className="flex items-center">
            <Target className="mr-1.5 h-4 w-4" />
            {t('knowledge.common.tokensCount', {
              count: knowledgeBase.token_num || 0,
            })}
          </div>
          <div className="flex items-center">
            <Clock className="mr-1.5 h-4 w-4" />
            {formatTime(knowledgeBase.update_time)}
          </div>
        </div>
      </div>
    </Card>
  )
}
