import type { FC } from 'react'
import {
  Clock,
  Database,
  FileText,
  Layers,
  MoreVertical,
  Settings,
  Target,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { cn } from '@/lib/utils'
import type { KnowledgeBase } from '@/types/api'

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
  const gradient = getAvatarGradient(knowledgeBase.name)

  return (
    <Card
      className={cn(
        'rounded-radius-xl group relative cursor-pointer transition-all duration-300',
        'hover:shadow-elevation-medium hover:-translate-y-0.5 hover:border-state-focus',
        selected && 'ring-2 ring-text-accent',
      )}
      onClick={onClick}
      padding="none"
    >
      <div className="p-space-lg">
        <div className="mb-space-base flex items-start justify-between">
          <div className="gap-space-sm flex min-w-0 flex-1 items-center">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              onClick={(event) => event.stopPropagation()}
            />
            {knowledgeBase.avatar ? (
              <Avatar className="h-10 w-10">
                <AvatarImage
                  alt={knowledgeBase.name}
                  src={knowledgeBase.avatar}
                />
                <AvatarFallback>
                  <Database className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={cn(
                  'rounded-radius-xl flex h-10 w-10 items-center justify-center',
                  'shadow-elevation-low bg-gradient-to-br',
                  gradient,
                )}
              >
                <span className="text-lg font-semibold text-text-inverted">
                  {knowledgeBase.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-text-primary">
                {knowledgeBase.name}
              </h3>
              <span
                className={cn(
                  'rounded-radius-full px-space-sm inline-flex items-center py-0.5 text-xs font-medium',
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
              onClick={onSettings}
            >
              {t('knowledge.list.actions.settings')}
            </DropdownItem>
            <DropdownItem
              danger
              icon={<Trash2 className="h-4 w-4" />}
              onClick={onDelete}
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
            'gap-space-sm grid grid-cols-2 text-sm text-text-tertiary',
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
