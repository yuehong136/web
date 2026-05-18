import React from 'react'
import { useTranslation } from 'react-i18next'

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
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  metadataMode,
  onModeChange,
  metadataCondition,
  onConditionChange,
  metadataSemiAutoFields,
  onSemiAutoFieldsChange,
  metadataFields,
}) => {
  const { t } = useTranslation()

  return (
    <div className="pt-space-base border-t border-border-default">
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
