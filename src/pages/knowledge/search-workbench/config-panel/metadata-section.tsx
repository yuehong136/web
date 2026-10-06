import React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { MetadataCondition } from '@/types/api'
import {
  MetadataFilter,
  type MetadataFilterMode,
  type MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'

interface MetadataSectionProps {
  metadataMode: MetadataFilterMode
  onModeChange: (mode: MetadataFilterMode) => void
  metadataCondition: MetadataCondition
  onConditionChange: (condition: MetadataCondition) => void
  metadataSemiAutoFields: MetadataSemiAutoField[]
  onSemiAutoFieldsChange: (fields: MetadataSemiAutoField[]) => void
  metadataFields: string[]
  loading: boolean
  error: boolean
  onRetry: () => void
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  metadataMode,
  onModeChange,
  metadataCondition,
  onConditionChange,
  metadataSemiAutoFields,
  onSemiAutoFieldsChange,
  metadataFields,
  loading,
  error,
  onRetry,
}) => {
  const { t } = useTranslation()

  return (
    <div className="border-t border-border-default pt-space-base">
      {loading && (
        <p role="status" className="mb-space-sm text-xs text-text-tertiary">
          {t('knowledge.search.metadataFilter.loadingFields')}
        </p>
      )}
      {error && (
        <div role="alert" className="mb-space-sm text-sm text-status-error">
          <p>{t('knowledge.search.metadataFilter.fieldsError')}</p>
          <Button variant="ghost" size="sm" onClick={onRetry}>
            {t('knowledge.search.errors.retry')}
          </Button>
        </div>
      )}
      <MetadataFilter
        mode={metadataMode}
        onModeChange={onModeChange}
        value={metadataCondition}
        onChange={onConditionChange}
        metadataFields={metadataFields}
        semiAutoFields={metadataSemiAutoFields}
        onSemiAutoFieldsChange={onSemiAutoFieldsChange}
        enabledModes={['disabled', 'auto', 'semi_auto', 'manual']}
      />
      {metadataMode === 'manual' && metadataFields.length === 0 && (
        <p className="mt-space-xs text-xs text-text-tertiary">
          {t('knowledge.search.config.manualMetadataEmpty')}
        </p>
      )}
    </div>
  )
}
