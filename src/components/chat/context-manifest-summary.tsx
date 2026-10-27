import { ChevronDown, Layers3 } from 'lucide-react'
import type { ContextManifest } from '@/lib/ai-workspace/contracts'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { cn } from '@/lib/utils'

export interface ContextManifestSummaryProps {
  manifest: ContextManifest
  className?: string
}

/** Read-only disclosure: selection/submission never claims server-observed use. */
export function ContextManifestSummary({
  manifest,
  className,
}: ContextManifestSummaryProps) {
  const { t } = useTypedTranslation('chat.aiWorkspace')
  if (!manifest.resources.length) return null
  return (
    <details
      className={cn('group text-xs text-text-secondary', className)}
      data-context-stage={manifest.stage}
    >
      <summary className="flex cursor-pointer list-none items-center gap-space-xs rounded-radius-sm py-space-xs focus-visible:outline focus-visible:outline-state-focus">
        <Layers3 className="size-icon-sm shrink-0" aria-hidden="true" />
        <span>{t('context')}</span>
        <span className="text-text-caption">{t(manifest.stage)}</span>
        <ChevronDown
          className="ml-auto size-icon-sm shrink-0 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-space-sm pt-space-sm">
        <p className="max-w-prose leading-relaxed text-text-caption">
          {t(
            manifest.stage === 'submitted'
              ? 'snapshotNotice'
              : 'selectionNotice',
          )}
        </p>
        <ul className="space-y-space-sm">
          {manifest.resources.map((resource) => (
            <li
              key={`${resource.kind}:${resource.id}`}
              className="flex flex-wrap items-baseline gap-x-space-sm gap-y-space-xs"
              data-context-origin={resource.origin}
              data-context-availability={resource.availability}
            >
              <span>{t(resource.kind)}</span>
              <span className="min-w-0 font-medium break-words text-text-primary">
                {resource.label}
              </span>
              <span className="text-text-caption">
                {t(resource.origin)} · {t(resource.availability)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
