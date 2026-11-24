import { useTranslation } from 'react-i18next'
import type { MemorySourceFragment } from '@/types/memory-segments'

/** Shows immutable metadata only; source bodies and model instructions are never rendered here. */
export function MemoryFragmentProvenance({
  fragment,
}: {
  fragment?: MemorySourceFragment
}) {
  const { t } = useTranslation()
  if (!fragment) return null
  return (
    <div className="min-w-0 space-y-space-xs text-xs">
      <p className="font-medium">
        {t('memory.segments.fragment', {
          number: fragment.part_index + 1,
          total: fragment.part_count,
        })}
      </p>
      <dl className="grid min-w-0 grid-cols-1 gap-space-xs sm:grid-cols-2">
        <dt>{t('memory.segments.core')}</dt>
        <dd className="min-w-0 font-mono">
          {t('memory.segments.range', {
            start: fragment.core_start,
            end: fragment.core_end,
          })}
        </dd>
        <dt>{t('memory.segments.read')}</dt>
        <dd className="min-w-0 font-mono">
          {t('memory.segments.range', {
            start: fragment.read_start,
            end: fragment.read_end,
          })}
        </dd>
      </dl>
      <p className="text-fg-muted">{t('memory.segments.offsetHint')}</p>
      <details>
        <summary className="cursor-pointer">
          {t('memory.segments.provenance')}
        </summary>
        <dl className="mt-space-xs grid min-w-0 grid-cols-1 gap-space-xs sm:grid-cols-2">
          {(
            [
              ['identity', fragment.fragment_id],
              ['coreHash', fragment.core_sha256],
              ['readHash', fragment.read_sha256],
              ['splitter', fragment.splitter_version],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="contents">
              <dt>{t(`memory.segments.${label}`)}</dt>
              <dd className="min-w-0 font-mono break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}
