import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns/section-card'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
export function MemoryStartupText({
  text,
  used,
  budget,
  onCopy,
  onExport,
  feedback,
  children,
}: {
  text: string
  used: number
  budget: number
  onCopy: () => void
  onExport: () => void
  feedback?: string
  children?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <section aria-label={t('memory.startup.result')} className="min-w-0">
      <SectionCard title={t('memory.startup.result')}>
        <div className="min-w-0 space-y-space-base">
          <Alert variant="info">{t('memory.startup.snapshotBoundary')}</Alert>
          <p className="text-xs text-text-secondary">
            {t('memory.startup.tokenEstimate', { used, budget })}
          </p>
          {text ? (
            <pre className="max-w-full rounded-radius-md bg-background-subtle p-space-base text-sm wrap-anywhere whitespace-pre-wrap">
              {text}
            </pre>
          ) : (
            <Alert variant="warning">{t('memory.startup.empty')}</Alert>
          )}
          <div className="flex flex-wrap gap-space-sm">
            <Button variant="outline" disabled={!text} onClick={onCopy}>
              {t('memory.startup.copy')}
            </Button>
            <Button
              variant="outline"
              disabled={!text}
              className="h-auto min-h-9 max-w-full text-left whitespace-normal"
              onClick={onExport}
            >
              {t('memory.startup.export')}
            </Button>
          </div>
          {feedback && <output className="block text-xs">{t(feedback)}</output>}
          {children}
        </div>
      </SectionCard>
    </section>
  )
}
