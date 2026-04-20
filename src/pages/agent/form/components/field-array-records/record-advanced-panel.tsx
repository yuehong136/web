import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type RecordAdvancedPanelProps = {
  children: ReactNode
  className?: string
}

export function RecordAdvancedPanel({
  children,
  className,
}: RecordAdvancedPanelProps) {
  return (
    <div className={cn('space-y-space-sm text-sm', className)}>{children}</div>
  )
}
