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
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent-solid/15 bg-accent-solid/5 p-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid/10">
          <AlertCircle className="h-3.5 w-3.5 text-accent-solid" />
        </div>
        <p className="text-xs leading-relaxed text-fg-muted">
          {t('knowledge.metadata.modal.manageTip')}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-info-line bg-info-soft p-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-info-fg" />
      <p className="text-xs leading-relaxed text-fg-muted">
        {t('knowledge.metadata.modal.settingTip')}
      </p>
    </div>
  )
}
