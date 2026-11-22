import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'

/** Presentation props are independent of the recommendation transport contract. */
export function MemoryTargetCard({
  entryId,
  revision,
  content,
  fingerprint,
  reasons,
  sources,
  truncated,
  selected,
  disabled,
  onSelected,
}: {
  entryId: string
  revision: string | number
  content: string | null
  fingerprint: string
  reasons: ReactNode
  sources: ReactNode
  truncated: boolean
  selected: boolean
  disabled: boolean
  onSelected: (selected: boolean) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <article className="min-w-0 space-y-space-base rounded-radius-lg border border-border-default bg-background-surface p-space-base">
      <div className="flex min-w-0 items-start gap-space-sm">
        <Checkbox
          id={id}
          checked={selected}
          disabled={disabled || content === null}
          onCheckedChange={(value) => onSelected(value === true)}
        />
        <Label htmlFor={id} className="min-w-0">
          {t('memory.targets.select')}
        </Label>
      </div>
      <dl className="grid min-w-0 grid-cols-1 gap-space-xs text-xs sm:grid-cols-2">
        <dt>{t('memory.targets.entry')}</dt>
        <dd className="min-w-0 font-mono break-all">{entryId}</dd>
        <dt>{t('memory.targets.revision')}</dt>
        <dd className="min-w-0 font-mono break-all">{revision}</dd>
      </dl>
      <div className="min-w-0 space-y-space-xs">
        <h4 className="text-xs font-medium">{t('memory.targets.content')}</h4>
        {content === null ? (
          <Alert variant="warning">{t('memory.targets.unavailable')}</Alert>
        ) : (
          <pre className="max-w-full rounded-radius-md bg-background-subtle p-space-sm text-sm wrap-anywhere whitespace-pre-wrap">
            {content}
          </pre>
        )}
        {truncated && (
          <Alert variant="warning">{t('memory.targets.truncated')}</Alert>
        )}
      </div>
      <div className="min-w-0 space-y-space-xs text-sm">
        <h4 className="font-medium">{t('memory.targets.reason')}</h4>
        {reasons}
      </div>
      <details className="min-w-0 text-xs">
        <summary className="cursor-pointer">
          {t('memory.targets.sources')}
        </summary>
        <div className="mt-space-sm min-w-0 space-y-space-xs">{sources}</div>
        <p className="mt-space-sm text-text-secondary">
          {t('memory.targets.fingerprint')}
        </p>
        <p className="min-w-0 font-mono break-all">{fingerprint}</p>
      </details>
    </article>
  )
}
