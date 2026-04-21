import { useMemo } from 'react'

export function useValues(selectedTools?: Record<string, unknown>) {
  return useMemo(
    () => ({
      items: Object.keys(selectedTools || {}),
    }),
    [selectedTools],
  )
}
