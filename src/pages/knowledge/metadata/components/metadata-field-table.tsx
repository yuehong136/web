import React from 'react'
import { useTranslation } from 'react-i18next'
import { Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetadataFieldRow } from '@/components/knowledge/MetadataFieldRow'
import type { MetadataTableData } from '@/types/api'

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

export const MetadataFieldTable: React.FC<MetadataFieldTableProps> = ({
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
        'overflow-hidden rounded-xl border border-border-default',
        'bg-surface-primary shadow-sm',
      )}
    >
      <div className="bg-surface-secondary/40 border-border-default/60 flex items-center border-b">
        <div className="w-[140px] shrink-0 px-4 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            {t('knowledge.metadata.modal.fieldName')}
          </span>
        </div>
        {isSettingMode && (
          <div className="w-[160px] shrink-0 px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
              {t('knowledge.metadata.modal.description')}
            </span>
          </div>
        )}
        <div className="flex-1 px-4 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            {isSettingMode
              ? t('knowledge.metadata.modal.optionalValues')
              : t('knowledge.metadata.modal.values')}
          </span>
        </div>
        <div className="w-[88px] shrink-0 px-4 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            {t('knowledge.metadata.modal.actions')}
          </span>
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-default">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <div className="relative mb-3 h-10 w-10">
              <div className="absolute inset-0 rounded-full border-2 border-border-default" />
              <div className="border-surface-accent absolute inset-0 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
            <span className="text-sm">
              {t('knowledge.metadata.modal.loading')}
            </span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="from-surface-secondary to-surface-tertiary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm">
              <Database className="h-7 w-7 text-text-tertiary" />
            </div>
            <p className="mb-1 text-sm font-medium text-text-secondary">
              {t('knowledge.metadata.modal.emptyTitle')}
            </p>
            <p className="max-w-[200px] text-xs text-text-tertiary">
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
