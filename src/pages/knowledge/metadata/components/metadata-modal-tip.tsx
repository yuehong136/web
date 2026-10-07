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
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-surface-accent/15 bg-surface-accent/5 p-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-accent/10">
          <AlertCircle className="h-3.5 w-3.5 text-surface-accent" />
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">
          {t('knowledge.metadata.modal.manageTip')}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-status-info-border bg-status-info-subtle p-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-status-info" />
      <p className="text-xs leading-relaxed text-text-secondary">
        {t('knowledge.metadata.modal.settingTip')}
      </p>
    </div>
  )
}
