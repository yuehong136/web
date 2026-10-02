import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Open the requested UI once and consume its URL flag without resetting the UI. */
export function useConsumedSearchFlag(key: string, expected: string) {
  const [params, setParams] = useSearchParams()
  const requested = params.get(key) === expected
  const [open, setOpen] = useState(requested)
  const [previousRequest, setPreviousRequest] = useState(requested)
  if (previousRequest !== requested) {
    setPreviousRequest(requested)
    if (requested) setOpen(true)
  }
  useEffect(() => {
    if (!requested) return
    const next = new URLSearchParams(params)
    next.delete(key)
    setParams(next, { replace: true })
  }, [key, params, requested, setParams])
  return [open, setOpen] as const
}
