import { useMemo } from 'react'

interface JsonViewerProps {
  data: any
  className?: string
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }, [data])

  return (
    <pre
      className={`max-h-[300px] overflow-auto rounded-radius-md bg-sunken p-space-sm text-xs ${className || ''}`}
    >
      <code>{formattedJson}</code>
    </pre>
  )
}
