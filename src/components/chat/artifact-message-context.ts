import { createContext, useContext } from 'react'

export const ArtifactMessageContext = createContext<string | undefined>(
  undefined,
)
export const useArtifactMessageId = () => useContext(ArtifactMessageContext)
