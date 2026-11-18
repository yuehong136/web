import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Full-page hint while files are dragged over Home. */
export function HomeDropOverlay() {
  const { t } = useTranslation()
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-scrim backdrop-blur-sm">
      <div className="flex flex-col items-center gap-space-base rounded-radius-xl border-2 border-dashed border-line-focus bg-raised p-space-xl shadow-elevation-high">
        <Upload aria-hidden="true" className="size-icon-2xl text-accent-fg" />
        <p className="text-lg font-medium text-fg">
          {t('home.attachments.dropTitle')}
        </p>
        <p className="text-sm text-fg-muted">
          {t('home.attachments.dropDescription')}
        </p>
      </div>
    </div>
  )
}
