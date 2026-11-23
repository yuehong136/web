import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ErrorBannerProps {
  message?: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  const { t } = useTranslation()

  if (!message) {
    return null
  }

  return (
    <div className="rounded-radius-md border border-danger-line bg-danger-soft p-space-base">
      <div className="flex items-start gap-space-sm">
        <AlertTriangle className="mt-[2px] size-4 shrink-0 text-danger-fg" />
        <div className="min-w-0 space-y-space-xs">
          <Badge tone="danger">
            {t('agent.runtimePanel.logDetail.runError')}
          </Badge>
          <p className="text-sm whitespace-pre-wrap text-danger-fg">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
