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
      className={`bg-surface-secondary rounded-radius-md p-space-sm text-xs overflow-auto max-h-[300px] ${className || ''}`}
    >
      <code>{formattedJson}</code>
    </pre>
  )
}
