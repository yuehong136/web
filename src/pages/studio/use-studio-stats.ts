import { useEffect, useMemo, useState } from 'react'
import type { DialogApp } from '@/types/api'

export function useStudioStats(apps: DialogApp[], total: number) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return useMemo(
    () => ({
      total,
      published: apps.filter((app) => app.status === '1').length,
      draft: apps.filter((app) => app.status !== '1').length,
      recentUpdated: apps.filter(
        (app) =>
          new Date(app.update_date).getTime() > now - 7 * 24 * 60 * 60 * 1000,
      ).length,
    }),
    [apps, total, now],
  )
}
