import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { AiWorkspace } from '@/components/layout/ai-workspace'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { useAuthStore } from '@/stores/auth'
import type { ArtifactRef } from '@/lib/ai-workspace/contracts'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { isArtifactUrl } from '@/lib/agent/artifact-url'
import { ReferenceDetailPanel } from '@/components/chat/reference-detail-panel'
import { ChatWorkspaceContext } from '@/components/chat/chat-workspace-context'
import { sameArtifactIdentity } from '@/components/chat/artifact-identity'
import { getReturnFocusTargets } from '@/components/chat/use-return-focus'

const ArtifactDetailPanel = lazy(() =>
  import('@/components/chat/artifact-detail-panel').then((module) => ({
    default: module.ArtifactDetailPanel,
  })),
)
type ResourceTab = 'evidence' | 'artifacts'
interface Selection {
  scope: string
  open: boolean
  tab: ResourceTab
  reference?: {
    chunk: ReferenceChunk
    references: ReferenceChunk[]
    messageId?: string
  }
  artifact?: ArtifactRef
  returnFocusTargets?: readonly HTMLElement[]
}
const emptySelection = (scope: string): Selection => ({
  scope,
  open: false,
  tab: 'evidence',
})

export interface ChatWorkspaceProps {
  scopeKey: string
  children: ReactNode
}

/** Resource UI state is local to the mounted identity/thread, never persisted. */
export function ChatWorkspace({ scopeKey, children }: ChatWorkspaceProps) {
  const { t } = useTypedTranslation('chat.aiWorkspace')
  const [epoch, setEpoch] = useState(0)
  useEffect(
    () =>
      useAuthStore.subscribe((next, previous) => {
        if (!sameArtifactIdentity(next, previous))
          setEpoch((value) => value + 1)
      }),
    [],
  )
  const [scope, setScope] = useState({ key: scopeKey, generation: 0 })
  let generation = scope.generation
  if (scope.key !== scopeKey) {
    generation++
    setScope({ key: scopeKey, generation })
  }
  const resourceScope = `${scopeKey}:${generation}:${epoch}`
  const currentScope = useRef<string | null>(resourceScope)
  useLayoutEffect(() => {
    currentScope.current = resourceScope
    return () => {
      currentScope.current = null
    }
  }, [resourceScope])
  const [selection, setSelection] = useState(() =>
    emptySelection(resourceScope),
  )
  const visible =
    selection.scope === resourceScope
      ? selection
      : emptySelection(resourceScope)
  if (selection.scope !== resourceScope) setSelection(visible)
  const tabId = useId()
  const close = useCallback((open: boolean) => {
    if (!open) setSelection((previous) => ({ ...previous, open: false }))
  }, [])
  const viewReference = useCallback(
    (
      chunk: ReferenceChunk,
      references: ReferenceChunk[],
      messageId?: string,
    ) => {
      if (currentScope.current !== resourceScope) return
      const candidates = getReturnFocusTargets()
      const origin = candidates.some((element) =>
        element.closest('[data-workspace-main]'),
      )
        ? candidates
        : undefined
      setSelection((previous) => ({
        ...previous,
        scope: resourceScope,
        open: true,
        tab: 'evidence',
        reference: { chunk, references, messageId },
        returnFocusTargets: origin ?? previous.returnFocusTargets,
      }))
    },
    [resourceScope],
  )
  const viewArtifact = useCallback(
    (artifact: ArtifactRef) => {
      if (
        currentScope.current !== resourceScope ||
        !artifact.messageId ||
        !isArtifactUrl(artifact.url)
      )
        return
      const candidates = getReturnFocusTargets()
      const origin = candidates.some((element) =>
        element.closest('[data-workspace-main]'),
      )
        ? candidates
        : undefined
      setSelection((previous) => ({
        ...previous,
        scope: resourceScope,
        open: true,
        tab: 'artifacts',
        artifact:
          previous.artifact?.id === artifact.id ? previous.artifact : artifact,
        returnFocusTargets: origin ?? previous.returnFocusTargets,
      }))
    },
    [resourceScope],
  )
  const updateArtifactState = useCallback(
    (id: string, state: ArtifactRef['state'], mediaType?: string) => {
      setSelection((previous) => {
        if (
          previous.scope !== resourceScope ||
          previous.artifact?.id !== id ||
          (previous.artifact.state === state &&
            previous.artifact.mediaType === mediaType)
        )
          return previous
        return {
          ...previous,
          artifact: { ...previous.artifact, state, mediaType },
        }
      })
    },
    [resourceScope],
  )
  const actions = useMemo(
    () => ({ viewReference, viewArtifact, selectedArtifact: visible.artifact }),
    [viewReference, viewArtifact, visible.artifact],
  )
  const setTab = (tab: ResourceTab) =>
    setSelection((previous) => ({ ...previous, tab }))
  const navigateTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      !visible.reference ||
      !visible.artifact ||
      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
    )
      return
    event.preventDefault()
    const next: ResourceTab =
      event.key === 'Home'
        ? 'evidence'
        : event.key === 'End'
          ? 'artifacts'
          : visible.tab === 'evidence'
            ? 'artifacts'
            : 'evidence'
    setTab(next)
    document.getElementById(`${tabId}-${next}`)?.focus()
  }
  return (
    <ChatWorkspaceContext value={actions}>
      <AiWorkspace
        scopeKey={resourceScope}
        open={visible.open}
        onOpenChange={close}
        returnFocusTargets={visible.returnFocusTargets}
        detailTitle={t(visible.tab)}
        resizeLabel={t('resize')}
        detail={
          visible.open ? (
            <div
              className="flex h-full min-h-0 flex-col"
              data-workspace-resources
            >
              <div
                role="tablist"
                className="flex shrink-0 gap-space-sm border-b border-border-subtle p-space-sm"
              >
                {(['evidence', 'artifacts'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    id={`${tabId}-${tab}`}
                    aria-controls={`${tabId}-${tab}-panel`}
                    aria-selected={visible.tab === tab}
                    tabIndex={visible.tab === tab ? 0 : -1}
                    disabled={
                      tab === 'evidence'
                        ? !visible.reference
                        : !visible.artifact
                    }
                    onClick={() => setTab(tab)}
                    onKeyDown={navigateTab}
                    className="rounded-radius-sm px-space-sm py-space-xs text-sm text-text-secondary hover:bg-state-hover focus-visible:outline focus-visible:outline-state-focus disabled:opacity-50 aria-selected:bg-background-subtle aria-selected:font-medium aria-selected:text-text-primary"
                  >
                    {t(tab)}
                  </button>
                ))}
              </div>
              <section
                role="tabpanel"
                id={`${tabId}-evidence-panel`}
                aria-labelledby={`${tabId}-evidence`}
                hidden={visible.tab !== 'evidence'}
                className="min-h-0 flex-1"
              >
                {visible.reference && (
                  <ReferenceDetailPanel
                    chunk={visible.reference.chunk}
                    allChunks={visible.reference.references}
                    onClose={() => close(false)}
                    onSelectChunk={(chunk) => {
                      if (visible.reference)
                        viewReference(
                          chunk,
                          visible.reference.references,
                          visible.reference.messageId,
                        )
                    }}
                  />
                )}
              </section>
              <section
                role="tabpanel"
                id={`${tabId}-artifacts-panel`}
                aria-labelledby={`${tabId}-artifacts`}
                hidden={visible.tab !== 'artifacts'}
                className="min-h-0 flex-1"
              >
                {visible.artifact && (
                  <Suspense
                    fallback={
                      <output className="block p-space-md text-sm text-text-secondary">
                        {t('artifactLoading')}
                      </output>
                    }
                  >
                    <ArtifactDetailPanel
                      key={visible.artifact.id}
                      artifact={visible.artifact}
                      scopeKey={resourceScope}
                      onClose={() => close(false)}
                      onStateChange={updateArtifactState}
                    />
                  </Suspense>
                )}
              </section>
            </div>
          ) : null
        }
      >
        {children}
      </AiWorkspace>
    </ChatWorkspaceContext>
  )
}
