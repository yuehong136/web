import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function LogLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-text-secondary"
    >
      <span>{t('knowledge.logs.loadError')}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t('knowledge.common.retry')}
      </Button>
    </div>
  )
}
