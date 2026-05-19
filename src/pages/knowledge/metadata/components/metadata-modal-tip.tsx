import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Sparkles } from 'lucide-react'

interface MetadataModalTipProps {
  variant: 'manage' | 'setting'
}

export const MetadataModalTip: React.FC<MetadataModalTipProps> = ({
  variant,
}) => {
  const { t } = useTranslation()

  if (variant === 'manage') {
    return (
      <div className="bg-surface-accent/5 border-surface-accent/15 mt-4 flex items-start gap-2.5 rounded-lg border p-3">
        <div className="bg-surface-accent/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <AlertCircle className="text-surface-accent h-3.5 w-3.5" />
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">
          {t('knowledge.metadata.modal.manageTip')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-status-info/5 border-status-info/15 mt-4 flex items-start gap-2.5 rounded-lg border p-3">
      <Sparkles className="text-status-info mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-xs leading-relaxed text-text-secondary">
        {t('knowledge.metadata.modal.settingTip')}
      </p>
    </div>
  )
}
