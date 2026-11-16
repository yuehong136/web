import { createContext, useContext } from 'react'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import type { ArtifactRef } from '@/lib/ai-workspace/contracts'

/** Which evidence tab opens: the selected source, or every retrieved chunk. */
export type EvidenceView = 'sources' | 'chunks'

export interface EvidenceOptions {
  view?: EvidenceView
  /** Chunks the answer cites; the panel marks the rest as not cited. */
  cited?: ReferenceChunk[]
}

export interface ChatWorkspaceActions {
  selectedArtifact?: ArtifactRef
  viewArtifact: (artifact: ArtifactRef) => void
  viewReference: (
    chunk: ReferenceChunk,
    references: ReferenceChunk[],
    messageId?: string,
    options?: EvidenceOptions,
  ) => void
}

export const ChatWorkspaceContext = createContext<ChatWorkspaceActions | null>(
  null,
)
export const useChatWorkspace = () => useContext(ChatWorkspaceContext)
