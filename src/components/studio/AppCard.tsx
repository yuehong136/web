import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { AppAvatar } from './app-avatar'
import { AppActions, type AppActionProps } from './app-actions'
import { AppMetadata, AppStatus } from './app-metadata'

export type TimeFormatType = 'detailed' | 'compact' | 'relative'
interface AppCardProps extends AppActionProps {
  selected?: boolean
  onSelect?: (id: string) => void
  timeFormat?: TimeFormatType
}
/** App identity and edit are separate from selection and the action menu. */
export function AppCard({
  data,
  onEdit,
  onDelete,
  onExport,
  selected = false,
  onSelect,
  timeFormat = 'detailed',
}: AppCardProps) {
  const { t } = useTranslation()
  return (
    <article
      className={cn(
        'flex min-w-0 flex-col gap-space-md rounded-radius-lg border p-space-md transition-colors',
        selected
          ? 'border-state-focus bg-state-selected-bg'
          : 'border-components-card-border bg-components-card-bg hover:border-border-strong',
      )}
    >
      <div className="flex items-center gap-space-sm">
        {onSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(data.id)}
            aria-label={t('studio.card.selectApp', { name: data.name })}
          />
        )}
        <AppAvatar name={data.name} icon={data.icon} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-tertiary">{t('studio.card.app')}</p>
          <h2 className="truncate text-base font-semibold text-text-primary">
            <button
              type="button"
              onClick={() => onEdit?.(data)}
              className="max-w-full truncate rounded-radius-sm text-left outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
            >
              {data.name}
            </button>
          </h2>
        </div>
        <AppActions
          data={data}
          onEdit={onEdit}
          onDelete={onDelete}
          onExport={onExport}
        />
      </div>
      <p className="line-clamp-2 min-h-[2.5em] text-sm leading-relaxed text-text-secondary">
        {data.description || t('studio.card.noDescription')}
      </p>
      <div>
        <AppStatus status={data.status} />
      </div>
      <div className="mt-auto border-t border-border-subtle pt-space-sm">
        <AppMetadata app={data} timeFormat={timeFormat} />
      </div>
    </article>
  )
}
