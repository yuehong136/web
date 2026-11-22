import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/patterns/section-card'
import { useAuthStore } from '@/stores/auth'
import { useMemoryStartup } from '@/hooks/use-memory-startup'
import { copyToClipboard } from '@/lib/utils'
import { MemoryStartupForm } from './memory-startup-form'
import { MemoryStartupText } from './memory-startup-text'
import { MemoryStartupItems } from './memory-startup-items'
import { MemorySourceReader } from './memory-source-reader'
import type {
  MemoryStartupCapabilities,
  MemoryStartupPackage,
  MemoryStartupSource,
} from '@/types/memory-startup'
export function MemoryStartupWorkspace(props: {
  memoryId: string
  capability: MemoryStartupCapabilities
}) {
  const token = useAuthStore((s) => s.token),
    [owner, setOwner] = useState({ token, generation: 0 })
  if (owner.token !== token)
    setOwner({ token, generation: owner.generation + 1 })
  return (
    <StartupOwner key={`${props.memoryId}:${owner.generation}`} {...props} />
  )
}
function StartupOwner({
  memoryId,
  capability,
}: {
  memoryId: string
  capability: MemoryStartupCapabilities
}) {
  const { t } = useTranslation(),
    state = useMemoryStartup(memoryId)
  return (
    <div className="min-w-0 space-y-space-lg">
      <SectionCard title={t('memory.startup.preview')}>
        <MemoryStartupForm
          capability={capability}
          pending={state.pending}
          onDirty={() => state.clear(true)}
          onPreview={state.preview}
        />
      </SectionCard>
      {state.error && <Alert variant="warning">{t(state.error)}</Alert>}
      {state.value && (
        <StartupResult
          key={state.value.package_sha256}
          value={state.value}
          onInvalid={() => state.clear(true)}
        />
      )}
      <Button
        variant="ghost"
        disabled={!state.value && !state.error && !state.pending}
        onClick={() => state.clear()}
      >
        {t('memory.startup.clear')}
      </Button>
    </div>
  )
}
function StartupResult({
  value,
  onInvalid,
}: {
  value: MemoryStartupPackage
  onInvalid: () => void
}) {
  const [source, setSource] = useState<MemoryStartupSource | null>(null),
    [feedback, setFeedback] = useState<string>()
  const copy = async () => {
    try {
      await copyToClipboard(value.startup_text)
      setFeedback('memory.startup.copied')
    } catch {
      setFeedback('memory.startup.copyFailed')
    }
  }
  const save = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
    )
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = 'memory-startup.json'
      a.click()
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  return (
    <>
      <MemoryStartupText
        text={value.startup_text}
        used={value.usage.estimated_tokens}
        budget={value.usage.budget_tokens}
        onCopy={() => void copy()}
        onExport={save}
        feedback={feedback}
      />
      <MemoryStartupItems value={value} onSource={setSource} />
      {source && (
        <MemorySourceReader
          key={`${source.source_id}-${source.source_revision}-${source.source_generation}`}
          memoryId={value.memory_id}
          source={source}
          onInvalid={onInvalid}
        />
      )}
    </>
  )
}
