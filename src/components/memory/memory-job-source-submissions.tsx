import { useTranslation } from 'react-i18next'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import { sourceStateBinding } from '@/lib/memory-source-provenance'
import { MemorySourceSubmission } from './memory-source-submission'
import type { MemoryMaintenanceJob } from '@/types/memory-dreaming'
export function MemoryJobSourceSubmissions({
  memoryId,
  job,
}: {
  memoryId: string
  job: MemoryMaintenanceJob
}) {
  const { t } = useTranslation(),
    capability = useMemoryCapabilities(memoryId)
  if (
    capability.data?.structured_sources?.supported !== true ||
    ['stale', 'redacted', 'canceled'].includes(job.state)
  )
    return null
  const seen = new Set<string>()
  const inputs = job.inputs.filter((input) => {
    const key = JSON.stringify([
      input.source_id,
      input.source_revision,
      input.source_generation,
      input.content_sha256,
      input.source_provenance_sha256,
    ])
    if (['stale', 'redacted'].includes(input.coverage) || seen.has(key))
      return false
    seen.add(key)
    return true
  })
  return (
    <details className="min-w-0 space-y-space-sm text-sm">
      <summary className="cursor-pointer">
        {t('memory.sources.jobSources')}
      </summary>
      {inputs.map((input) => {
        const binding = sourceStateBinding({
          managed: true,
          memory_id: memoryId,
          source_id: input.source_id,
          source_revision: input.source_revision,
          generation: input.source_generation,
          content_sha256: input.content_sha256,
          scope: input.scope,
          state: 'active',
        })
        if (binding && input.source_provenance_sha256)
          binding.provenance_sha256 = input.source_provenance_sha256
        return (
          binding && (
            <div
              key={JSON.stringify(binding)}
              className="min-w-0 space-y-space-sm rounded-radius-md border border-border-subtle p-space-sm"
            >
              <p className="font-mono text-xs break-all">{input.source_id}</p>
              <MemorySourceSubmission
                memoryId={memoryId}
                sourceId={input.source_id}
                binding={binding}
                supported
              />
            </div>
          )
        )
      })}
    </details>
  )
}
