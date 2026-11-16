import { useState } from 'react'
import type { ComponentRow } from './system-status'

/**
 * The status endpoint reports one latency per component, so the trend is
 * built from the polls made while the page is open (newest last).
 */
export function useLatencyHistory(
  rows: readonly ComponentRow[],
  updatedAt: number,
  limit = 20,
): Record<string, number[]> {
  const [state, setState] = useState<{
    at: number
    history: Record<string, number[]>
  }>({ at: 0, history: {} })
  if (updatedAt && updatedAt !== state.at) {
    const history = { ...state.history }
    for (const row of rows)
      if (row.latency !== null)
        history[row.id] = [...(history[row.id] ?? []), row.latency].slice(
          -limit,
        )
    setState({ at: updatedAt, history })
  }
  return state.history
}
