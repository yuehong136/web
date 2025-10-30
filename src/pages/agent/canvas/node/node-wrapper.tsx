import { cn } from '@/lib/utils'
import type { PropsWithChildren } from 'react'

interface NodeWrapperProps extends PropsWithChildren {
  selected?: boolean
  className?: string
}

export const NodeWrapper = ({
  children,
  selected,
  className,
}: NodeWrapperProps) => {
  return (
    <div
      className={cn(
        'min-w-[200px] bg-white rounded-lg border transition-all group',
        selected
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20'
          : 'border-gray-200 shadow hover:shadow-lg',
        className,
      )}
    >
      {children}
    </div>
  )
}

