import { useCallback } from 'react'

export function useOpenDocument() {
  return useCallback(() => {
    window.open('https://ragflow.io/docs/dev/category/agent-components', '_blank')
  }, [])
}
