import { ArrowUp, FileText, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/** Sample content is intentionally labelled as a preview, never as a real run. */
export function AppearancePreview() {
  const { t } = useTranslation()
  return (
    <section
      aria-label={t('appearance.preview')}
      className="overflow-hidden rounded-radius-xl border border-line bg-surface shadow-elevation-low"
    >
      <div className="flex items-center gap-space-sm border-b border-line-subtle px-space-lg py-space-base">
        <Sparkles className="size-icon-sm text-accent-fg" />
        <h2 className="text-sm font-semibold">{t('appearance.preview')}</h2>
      </div>
      <div className="space-y-space-lg p-space-lg">
        <p className="text-xs text-fg-muted">
          {t('appearance.previewDescription')}
        </p>
        <p className="ml-space-lg rounded-radius-lg bg-sunken p-space-base text-sm">
          {t('appearance.previewQuestion')}
        </p>
        <div className="space-y-space-base">
          <Sparkles className="size-icon-md text-fg-muted" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-fg">
            {t('appearance.previewAnswer')}
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileText className="size-icon-sm" />}
              >
                {t('appearance.previewSource')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-[calc(100vw-2rem)] border-line bg-surface p-space-base shadow-elevation-medium">
              <p className="mb-space-xs text-sm font-semibold">
                {t('appearance.previewDocument')}
              </p>
              <p className="text-sm text-fg-muted">
                {t('appearance.previewSourceDetail')}
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-space-base rounded-radius-lg border border-line bg-surface p-space-base">
          <span className="min-w-0 flex-1 text-sm text-fg-subtle">
            {t('appearance.previewComposer')}
          </span>
          <span
            aria-label={t('appearance.previewSend')}
            className="flex size-8 shrink-0 items-center justify-center rounded-radius-full bg-action-bg text-action-fg"
          >
            <ArrowUp className="size-icon-sm" />
          </span>
        </div>
      </div>
    </section>
  )
}
