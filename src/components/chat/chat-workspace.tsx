import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AiWorkspace } from '@/components/layout/ai-workspace'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { useAuthStore } from '@/stores/auth'
import type { ArtifactRef } from '@/lib/ai-workspace/contracts'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { isArtifactUrl } from '@/lib/agent/artifact-url'
import {
  ChatWorkspaceContext,
  type EvidenceOptions,
} from '@/components/chat/chat-workspace-context'
import { sameArtifactIdentity } from '@/components/chat/artifact-identity'
import { getReturnFocusTargets } from '@/components/chat/use-return-focus'
import {
  EvidencePanel,
  type EvidenceSelection,
  type EvidenceTab,
} from '@/components/chat/evidence-panel'

interface Selection {
  scope: string
  open: boolean
  tab: EvidenceTab
  reference?: EvidenceSelection
  artifact?: ArtifactRef
  returnFocusTargets?: readonly HTMLElement[]
}
const emptySelection = (scope: string): Selection => ({
  scope,
  open: false,
  tab: 'sources',
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
  const close = useCallback((open: boolean) => {
    if (!open) setSelection((previous) => ({ ...previous, open: false }))
  }, [])
  const viewReference = useCallback(
    (
      chunk: ReferenceChunk,
      references: ReferenceChunk[],
      messageId?: string,
      options?: EvidenceOptions,
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
        tab: options?.view ?? 'sources',
        reference: {
          chunk,
          references,
          messageId,
          cited:
            options?.cited ??
            (previous.reference?.references === references
              ? previous.reference.cited
              : undefined),
        },
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
  const setTab = (tab: EvidenceTab) =>
    setSelection((previous) => ({ ...previous, tab }))
  const selectChunk = (chunk: ReferenceChunk) =>
    setSelection((previous) =>
      previous.reference
        ? { ...previous, reference: { ...previous.reference, chunk } }
        : previous,
    )
  return (
    <ChatWorkspaceContext value={actions}>
      <AiWorkspace
        scopeKey={resourceScope}
        open={visible.open}
        onOpenChange={close}
        returnFocusTargets={visible.returnFocusTargets}
        detailTitle={t(visible.tab)}
        resizeLabel={t('resize')}
        phoneSheetSide="bottom"
        detail={
          visible.open ? (
            <EvidencePanel
              tab={visible.tab}
              onTabChange={setTab}
              reference={visible.reference}
              artifact={visible.artifact}
              scopeKey={resourceScope}
              onSelectChunk={selectChunk}
              onArtifactStateChange={updateArtifactState}
              onClose={() => close(false)}
            />
          ) : null
        }
      >
        {children}
      </AiWorkspace>
    </ChatWorkspaceContext>
  )
}
