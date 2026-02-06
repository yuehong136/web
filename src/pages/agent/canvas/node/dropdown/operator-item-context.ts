import { createContext } from 'react'

export const HideModalContext = createContext<(() => void) | undefined>(undefined)

export const OnNodeCreatedContext = createContext<
  ((newNodeId: string) => void) | undefined
>(undefined)
