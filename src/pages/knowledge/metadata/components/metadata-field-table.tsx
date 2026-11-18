import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MetadataTableData } from '@/types/api'
import { MetadataFieldRow } from './metadata-field-row'

interface MetadataFieldTableProps {
  data: MetadataTableData[]
  isLoading: boolean
  isSettingMode: boolean
  allowRemoveValue: boolean
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onRemoveValue: (index: number, value: string) => void
  disabled?: boolean
}

export const MetadataFieldTable: FC<MetadataFieldTableProps> = ({
  data,
  isLoading,
  isSettingMode,
  allowRemoveValue,
  onEdit,
  onDelete,
  onRemoveValue,
  disabled = false,
}) => {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-line',
        'bg-surface shadow-xs',
      )}
    >
      <div className="flex items-center border-b border-line/60 bg-sunken/40">
        <div className="w-[140px] shrink-0 px-4 py-2.5">
          <span className="text-xs font-medium tracking-wider text-fg-muted uppercase">
            {t('knowledge.metadata.modal.fieldName')}
          </span>
        </div>
        {isSettingMode && (
          <div className="w-[160px] shrink-0 px-4 py-2.5">
            <span className="text-xs font-medium tracking-wider text-fg-muted uppercase">
              {t('knowledge.metadata.modal.description')}
            </span>
          </div>
        )}
        <div className="flex-1 px-4 py-2.5">
          <span className="text-xs font-medium tracking-wider text-fg-muted uppercase">
            {isSettingMode
              ? t('knowledge.metadata.modal.optionalValues')
              : t('knowledge.metadata.modal.values')}
          </span>
        </div>
        <div className="w-[88px] shrink-0 px-4 py-2.5">
          <span className="text-xs font-medium tracking-wider text-fg-muted uppercase">
            {t('knowledge.metadata.modal.actions')}
          </span>
        </div>
      </div>

      <div className="scrollbar-thin max-h-[360px] scrollbar-thumb-border-default scrollbar-track-transparent overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-fg-muted">
            <div className="relative mb-3 h-10 w-10">
              <div className="absolute inset-0 rounded-full border-2 border-line" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-accent-solid border-t-transparent" />
            </div>
            <span className="text-sm">
              {t('knowledge.metadata.modal.loading')}
            </span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-fill-muted">
              <Database className="h-7 w-7 text-fg-subtle" />
            </div>
            <p className="mb-1 text-sm font-medium text-fg-muted">
              {t('knowledge.metadata.modal.emptyTitle')}
            </p>
            <p className="max-w-[200px] text-xs text-fg-subtle">
              {t('knowledge.metadata.modal.emptyDescription')}
            </p>
          </div>
        ) : (
          data.map((item, index) => (
            <MetadataFieldRow
              key={`${item.field}-${index}`}
              field={item.field}
              description={item.description}
              values={item.values.map((v) => ({ value: v }))}
              showDescription={isSettingMode}
              allowRemoveValue={allowRemoveValue}
              onRemoveValue={(value) => onRemoveValue(index, value)}
              onEdit={() => onEdit(index)}
              onDelete={() => onDelete(index)}
              disabled={disabled}
            />
          ))
        )}
      </div>
    </div>
  )
}
