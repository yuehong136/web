import { createContext, useContext, type PropsWithChildren } from 'react'
import type { ApplicationComposition } from './composition'
import type { PlatformPort } from './platform'

const ApplicationCompositionContext =
  createContext<ApplicationComposition | null>(null)

export interface PlatformProviderProps extends PropsWithChildren {
  readonly composition: ApplicationComposition
}

export function PlatformProvider({
  composition,
  children,
}: PlatformProviderProps) {
  return (
    <ApplicationCompositionContext.Provider value={composition}>
      {children}
    </ApplicationCompositionContext.Provider>
  )
}

export function useApplicationComposition(): ApplicationComposition {
  const composition = useContext(ApplicationCompositionContext)
  if (!composition) {
    throw new Error('Application composition provider is unavailable.')
  }
  return composition
}

export function usePlatform(): PlatformPort {
  return useApplicationComposition().platform
}
