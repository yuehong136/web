import { cn } from '@/lib/utils'
import { Loader } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { forwardRef, useContext } from 'react'
import { AgentInstanceContext } from '../../context'

interface NodeWrapperProps extends PropsWithChildren {
  selected?: boolean
  className?: string
  id?: string
}

export const NodeWrapper = forwardRef<HTMLDivElement, NodeWrapperProps>(
  ({ children, selected, className, id }, ref) => {
  const { currentSendLoading, startButNotFinishedNodeIds = [] } =
    useContext(AgentInstanceContext)

  return (
    <div
      ref={ref}
      className={cn(
        'group relative w-[208px] rounded-radius-lg border border-border-subtle bg-components-studio-surface px-space-base py-space-base text-xs shadow-elevation-low transition-[border-color]',
        { 'border-[var(--color-components-canvas-node-border-selected)]': selected },
        className,
      )}
    >
      {id &&
        startButNotFinishedNodeIds.indexOf(id) > -1 &&
        currentSendLoading && (
          <div className="absolute right-0 left-0 top-0 flex items-start justify-end p-space-xs">
            <Loader size={12} className="animate-spin text-text-secondary" />
          </div>
        )}
      {children}
    </div>
  )
},
)

NodeWrapper.displayName = 'NodeWrapper'
