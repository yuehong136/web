import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useMemorySourceProvenance } from '@/hooks/use-memory-source-provenance'
import { MemorySourceAttribution } from './memory-source-attribution'
import type { MemorySourceBinding } from '@/types/memory-sources'
export function MemorySourceSubmission({
  memoryId,
  sourceId,
  binding,
  supported,
  onInvalid,
}: {
  memoryId: string
  sourceId: string
  binding?: MemorySourceBinding
  supported: boolean
  onInvalid?: () => void
}) {
  const { t } = useTranslation(),
    state = useMemorySourceProvenance(memoryId, sourceId, binding)
  useEffect(() => {
    if (state.error === 'memory.sources.changed') onInvalid?.()
  }, [state.error, onInvalid])
  if (!supported) return null
  return (
    <section
      className="min-w-0 space-y-space-sm"
      aria-label={t('memory.sources.inspect')}
      aria-busy={state.pending}
    >
      <p className="text-xs text-text-secondary">{t('memory.sources.idle')}</p>
      <div className="flex flex-wrap gap-space-sm">
        <Button
          size="sm"
          variant="outline"
          disabled={state.pending}
          onClick={state.read}
        >
          {t('memory.sources.inspect')}
        </Button>
        {!!state.value && (
          <Button size="sm" variant="ghost" onClick={() => state.clear()}>
            {t('memory.sources.close')}
          </Button>
        )}
      </div>
      {state.error && <Alert variant="warning">{t(state.error)}</Alert>}
      {state.value && (
        <>
          <MemorySourceAttribution value={state.value} />
          {state.value.provenance_sha256 !== null && (
            <dl className="space-y-space-xs text-xs">
              <dt>{t('memory.sources.digest')}</dt>
              <dd className="font-mono break-all">
                {state.value.provenance_sha256}
              </dd>
            </dl>
          )}
        </>
      )}
    </section>
  )
}
