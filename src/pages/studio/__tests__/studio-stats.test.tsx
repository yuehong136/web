// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { useStudioStats } from '../use-studio-stats'
import type { DialogApp } from '@/types/api'

it('updates the weekly statistics with time and disposes its clock on unmount', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.useFakeTimers()
  vi.setSystemTime(14 * 24 * 3600_000)
  const apps = [
    {
      status: '1',
      update_date: new Date(7 * 24 * 3600_000 + 30_000).toISOString(),
    },
  ] as DialogApp[]
  function Probe() {
    const stats = useStudioStats(apps, 10)
    return <output>{JSON.stringify(stats)}</output>
  }
  const container = document.createElement('div')
  const root = createRoot(container)
  try {
    await act(async () => root.render(<Probe />))
    expect(JSON.parse(container.textContent || '{}')).toEqual({
      total: 10,
      published: 1,
      draft: 0,
      recentUpdated: 1,
    })
    await act(async () => vi.advanceTimersByTimeAsync(60_000))
    expect(JSON.parse(container.textContent || '{}').recentUpdated).toBe(0)
  } finally {
    act(() => root.unmount())
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  }
})
