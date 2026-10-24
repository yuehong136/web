import { createContext, useContext } from 'react'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import type { ArtifactRef } from '@/lib/ai-workspace/contracts'

export interface ChatWorkspaceActions {
  selectedArtifact?: ArtifactRef
  viewArtifact: (artifact: ArtifactRef) => void
  viewReference: (
    chunk: ReferenceChunk,
    references: ReferenceChunk[],
    messageId?: string,
  ) => void
}

export const ChatWorkspaceContext = createContext<ChatWorkspaceActions | null>(
  null,
)
export const useChatWorkspace = () => useContext(ChatWorkspaceContext)
