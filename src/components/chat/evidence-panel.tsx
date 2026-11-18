import { lazy, Suspense, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import type { ArtifactRef } from '@/lib/ai-workspace/contracts'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { EvidenceSourceDetail } from './evidence-source-detail'
import { EvidenceChunkList } from './evidence-chunk-list'

const ArtifactDetailPanel = lazy(() =>
  import('@/components/chat/artifact-detail-panel').then((module) => ({
    default: module.ArtifactDetailPanel,
  })),
)

export type EvidenceTab = 'sources' | 'chunks' | 'artifacts'

export interface EvidenceSelection {
  chunk: ReferenceChunk
  references: ReferenceChunk[]
  cited?: ReferenceChunk[]
  messageId?: string
}

export interface EvidencePanelProps {
  tab: EvidenceTab
  onTabChange: (tab: EvidenceTab) => void
  reference?: EvidenceSelection
  artifact?: ArtifactRef
  scopeKey: string
  onSelectChunk: (chunk: ReferenceChunk) => void
  onArtifactStateChange: (
    id: string,
    state: ArtifactRef['state'],
    mediaType?: string,
  ) => void
  onClose: () => void
}

const BODY =
  'mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-space-md data-[state=inactive]:hidden'

/**
 * Evidence for one answer: the selected source with its combined, vector and
 * keyword scores, every retrieved chunk, and generated artifacts. Panels stay
 * mounted so each keeps its scroll position while the reader switches tabs.
 */
export function EvidencePanel({
  tab,
  onTabChange,
  reference,
  artifact,
  scopeKey,
  onSelectChunk,
  onArtifactStateChange,
  onClose,
}: EvidencePanelProps) {
  const { t } = useTypedTranslation('chat.aiWorkspace')
  const sources = useRef<HTMLDivElement>(null)
  const chunk = reference?.chunk
  // Another chunk opens at its top, not at the scroll position of the last one.
  useEffect(() => {
    if (sources.current) sources.current.scrollTop = 0
  }, [chunk])
  const count = reference?.references.length ?? 0
  const citedCount = reference?.cited?.length ?? count
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as EvidenceTab)}
      className="flex h-full min-h-0 flex-col bg-surface"
      data-workspace-resources
    >
      <div className="flex shrink-0 items-stretch gap-space-sm border-b border-line ps-space-md pe-space-sm">
        <TabsList className="min-w-0 overflow-x-auto border-b-0">
          <TabsTrigger value="sources" disabled={!reference}>
            {t('sources')}
            {reference && (
              <span className="font-mono text-xs font-normal text-fg-subtle">
                {citedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="chunks" disabled={!reference}>
            {t('chunks')}
            {reference && (
              <span className="font-mono text-xs font-normal text-fg-subtle">
                {count}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="artifacts" disabled={!artifact}>
            {t('artifacts')}
          </TabsTrigger>
        </TabsList>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ms-auto self-center"
          onClick={onClose}
          aria-label={t('close')}
          title={t('close')}
        >
          <X aria-hidden="true" className="size-icon-sm" />
        </Button>
      </div>
      <TabsContent
        ref={sources}
        value="sources"
        forceMount
        className={BODY}
        data-evidence-body
      >
        {reference && (
          <EvidenceSourceDetail
            chunk={reference.chunk}
            references={reference.references}
            cited={reference.cited}
            onSelectChunk={onSelectChunk}
          />
        )}
      </TabsContent>
      <TabsContent
        value="chunks"
        forceMount
        className={BODY}
        data-evidence-body
      >
        {reference && (
          <EvidenceChunkList
            references={reference.references}
            cited={reference.cited}
            selected={reference.chunk}
            onSelect={(chunk) => {
              onSelectChunk(chunk)
              onTabChange('sources')
            }}
          />
        )}
      </TabsContent>
      <TabsContent
        value="artifacts"
        forceMount
        className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        {artifact && (
          <Suspense
            fallback={
              <output className="block p-space-md text-sm text-fg-muted">
                {t('artifactLoading')}
              </output>
            }
          >
            <ArtifactDetailPanel
              key={artifact.id}
              artifact={artifact}
              scopeKey={scopeKey}
              onClose={onClose}
              onStateChange={onArtifactStateChange}
            />
          </Suspense>
        )}
      </TabsContent>
    </Tabs>
  )
}
